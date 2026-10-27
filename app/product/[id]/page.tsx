import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicCurrencies } from '@/app/actions/public-currencies'
import { getPublicProductById, getPublicProducts } from '@/app/actions/public-products'
import { getPublicSettings } from '@/app/actions/public'
import { ProductDetail } from '@/components/product-detail'
import { displayProductCupPrice } from '@/lib/price-margin'
import type { Product } from '@/lib/store'
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  jsonLd,
  productSeoDescription,
} from '@/lib/seo'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

/** La ficha se regenera cada minuto: el stock cambia y no conviene servirlo viejo. */
export const revalidate = 60

/** Evita pedir el producto dos veces: metadatos y cuerpo comparten resultado. */
const getProduct = cache(getPublicProductById)

function imageUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  return absoluteUrl(path)
}

function offerFor(
  product: Product,
  currencies: Awaited<ReturnType<typeof getPublicCurrencies>>,
  globalMargin: number
) {
  const cup = currencies.find((currency) => currency.code === 'CUP')
  const display = currencies.find((currency) => currency.isDefault) || currencies[0]
  const baseCup = displayProductCupPrice(
    product.price,
    { globalMargin, productMargin: product.priceMargin },
    display?.code
  )
  const price =
    cup && display && display.code !== 'CUP'
      ? Math.round((baseCup / cup.exchangeRate) * display.exchangeRate * 100) / 100
      : baseCup

  return {
    price: price.toFixed(2),
    currencyCode: display?.code || 'CUP',
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: 'Producto no encontrado',
      robots: { index: false, follow: true },
    }
  }

  const title = `${product.name} a domicilio en Santiago de Cuba`
  const description = productSeoDescription(product)
  const image = imageUrl(product.image)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/product/${id}` },
    openGraph: {
      type: 'website',
      locale: 'es_CU',
      siteName: SITE_NAME,
      url: `/product/${id}`,
      title,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
  const [rawProduct, catalog, currencies, settings] = await Promise.all([
    getProduct(id),
    getPublicProducts(),
    getPublicCurrencies(),
    getPublicSettings(),
  ])

  if (!rawProduct) notFound()

  const product = rawProduct as unknown as Product
  const related = (catalog.products as unknown as Product[])
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 8)

  const inStock = product.inStock && product.stock > 0
  const offer = offerFor(product, currencies, settings.priceMargin)
  const canonical = absoluteUrl(`/product/${product.id}`)
  const image = imageUrl(product.image) || absoluteUrl('/icon-512x512.png')

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || productSeoDescription(product),
    image: [image],
    sku: product.id,
    category: product.category || undefined,
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: offer.currencyCode,
      price: offer.price,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: product.name,
        item: canonical,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([productSchema, breadcrumbSchema]),
        }}
      />
      <ProductDetail product={product} related={related} />
    </>
  )
}

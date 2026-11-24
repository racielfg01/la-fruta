import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublicProducts } from '@/app/actions/public-products'
import { jsonLd } from '@/lib/seo'
import {
  categoryFromSlug,
  categoryMetadata,
  categorySlug,
  itemListSchema,
} from '@/lib/seo-content'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  const { categories } = await getPublicProducts()
  return (categories as string[]).map((category) => ({
    slug: categorySlug(category),
  }))
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const { categories, products } = await getPublicProducts()
  const category = categoryFromSlug(slug, categories)

  if (!category) {
    return { title: 'Categoría no encontrada', robots: { index: false } }
  }

  const meta = categoryMetadata(
    category,
    products.filter((product) => product.category === category).length
  )

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: {
      type: 'website',
      locale: 'es_CU',
      siteName: 'MercaToma',
      url: `/categoria/${slug}`,
      title: meta.title,
      description: meta.description,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const { categories, products } = await getPublicProducts()
  const category = categoryFromSlug(slug, categories)

  if (!category) notFound()

  const items = products.filter((product) => product.category === category)
  const meta = categoryMetadata(category, items.length)

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(itemListSchema(category, items)),
        }}
      />
      <nav aria-label="Migas de pan" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Inicio</Link>
        <span aria-hidden> / </span>
        <span>{category}</span>
      </nav>

      <h1 className="mt-4 font-[family-name:var(--font-playfair)] text-3xl font-bold text-foreground">
        {meta.title}
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {meta.description}
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((product) => (
          <li key={product.id} className="rounded-xl border border-border bg-card p-4">
            <Link
              href={`/product/${product.id}`}
              className="font-semibold text-foreground hover:underline"
            >
              {product.name}
            </Link>
            {product.unit && (
              <p className="mt-1 text-xs text-muted-foreground">{product.unit}</p>
            )}
            {product.description && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            )}
          </li>
        ))}
      </ul>

      {items.length === 0 && (
        <p className="mt-8 text-sm text-muted-foreground">
          No hay productos disponibles en esta categoría ahora mismo.
        </p>
      )}
    </main>
  )
}

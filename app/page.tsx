import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicBanners, getPublicSettings } from '@/app/actions/public'
import { getPublicProducts } from '@/app/actions/public-products'
import { getPublicOffers } from '@/app/actions/public-offers'
import { HomeExperience } from '@/components/home-experience'
import type { Product } from '@/lib/store'
import {
  HOME_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  WHATSAPP_PHONE,
  absoluteUrl,
  jsonLd,
} from '@/lib/seo'
import {
  categorySlug,
  faqItems,
  faqPageSchema,
  localBusinessSchema,
} from '@/lib/seo-content'

/** El catálogo se refresca solo: una portada cacheada un minuto sigue siendo barata. */
export const revalidate = 60

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/` },
  openGraph: {
    type: 'website',
    locale: 'es_CU',
    siteName: SITE_NAME,
    url: '/',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
  },
}

export default async function HomePage() {
  const [{ products, categories }, banners, settings, offersResult] = await Promise.all([
    getPublicProducts(),
    getPublicBanners(),
    getPublicSettings(),
    getPublicOffers(),
  ])
  const offers = offersResult.success ? offersResult.data : []

  const storeName = settings.storeName || SITE_NAME
  const phone = settings.whatsappPhone || WHATSAPP_PHONE

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeName,
    url: SITE_URL,
    logo: absoluteUrl('/icon-512x512.png'),
    description: SITE_DESCRIPTION,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Santiago de Cuba',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${phone}`,
      contactType: 'customer service',
      areaServed: 'CU',
      availableLanguage: ['es'],
    },
  }

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: storeName,
    url: SITE_URL,
    inLanguage: 'es',
    publisher: {
      '@type': 'Organization',
      name: storeName,
    },
  }

  const faqs = faqItems(settings)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd([
            organization,
            website,
            localBusinessSchema(settings),
            faqPageSchema(faqs),
          ]),
        }}
      />
      <HomeExperience
        products={products as unknown as Product[]}
        categories={categories}
        banners={banners}
        offers={offers}
      />

      {/* Texto y enlaces en el HTML del servidor: da a Google y a los agentes
          algo que citar, y a la gente una forma de explorar por categoría. */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16 pt-12">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-foreground">
          Productos agrícolas frescos en Santiago de Cuba
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          En {storeName} compras frutas, viandas y alimentos del campo, bien
          pesados y llevados hasta tu casa. Elige tu zona de entrega para ver
          el stock disponible y paga en efectivo al recibir o por transferencia.
        </p>

        {categories.length > 0 && (
          <nav aria-label="Categorías de productos" className="mt-6">
            <h3 className="text-sm font-semibold text-foreground">Compra por categoría</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {(categories as string[]).map((category: string) => (
                <li key={category}>
                  <Link
                    href={`/categoria/${categorySlug(category)}`}
                    className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <h3 className="mt-10 text-lg font-bold text-foreground">Preguntas frecuentes</h3>
        <dl className="mt-3 grid max-w-3xl gap-4">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="text-sm font-semibold text-foreground">{faq.question}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

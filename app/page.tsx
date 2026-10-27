import type { Metadata } from 'next'
import { getPublicBanners, getPublicSettings } from '@/app/actions/public'
import { getPublicProducts } from '@/app/actions/public-products'
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
  const [{ products, categories }, banners, settings] = await Promise.all([
    getPublicProducts(),
    getPublicBanners(),
    getPublicSettings(),
  ])

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd([organization, website]) }}
      />
      <HomeExperience
        products={products as unknown as Product[]}
        categories={categories}
        banners={banners}
      />
    </>
  )
}

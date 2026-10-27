import type { MetadataRoute } from 'next'
import { getAllRecords, getPB } from '@/lib/pocketbase'
import { SITE_URL } from '@/lib/seo'

/** El catálogo cambia poco: una hora de caché evita golpear PocketBase en cada visita. */
export const revalidate = 3600

type SitemapProduct = {
  id: string
  updated?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/contacto`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terminos`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/privacidad`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let products: SitemapProduct[] = []
  try {
    products = (await getAllRecords(getPB(), 'products', {
      filter: 'is_visible = true',
      sort: 'name',
    })) as SitemapProduct[]
  } catch (error) {
    // Si PocketBase no responde, el sitemap conserva las páginas fijas.
    console.error('Sitemap: no se pudo leer el catálogo', error)
  }

  return [
    ...pages,
    ...products.map((product) => ({
      url: `${SITE_URL}/product/${product.id}`,
      lastModified: product.updated ? new Date(product.updated) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}

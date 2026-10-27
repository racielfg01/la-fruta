import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

/**
 * Solo las páginas públicas. Carrito, pago, perfil y administración quedan
 * fuera; `/api/img` se permite porque sirve las fotos de producto.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/img'],
        disallow: [
          '/admin',
          '/perfil',
          '/cart',
          '/checkout',
          '/order-confirmation',
          '/auth',
          '/auth-demo',
          '/offline',
          '/dev-preview-locs',
          '/api/upload',
          '/api/uploadthing',
          '/api/files',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

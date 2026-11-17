import { getPublicSettings } from '@/app/actions/public'
import { llmsTxt } from '@/lib/seo-content'

/** Resumen en texto plano para agentes de IA; se regenera con los ajustes de la tienda. */
export const revalidate = 3600

export async function GET() {
  const settings = await getPublicSettings()

  return new Response(llmsTxt(settings), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}

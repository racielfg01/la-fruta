import { ImageResponse } from 'next/og'
import { HOME_TITLE, SITE_NAME } from '@/lib/seo'

export const alt = `${SITE_NAME} — ${HOME_TITLE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Imagen que se ve al compartir la tienda en WhatsApp, Facebook o X. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0f2a52 0%, #0b6b5b 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: '#0ea5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{SITE_NAME}</div>
            <div style={{ fontSize: 22, color: '#c9efe9' }}>Del campo a tu mesa</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div
            style={{
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: -1,
              maxWidth: 980,
            }}
          >
            {HOME_TITLE}
          </div>
          <div style={{ fontSize: 28, color: '#d7f3ee' }}>
            Frutas, viandas y verduras frescas · Entrega por zona · Pago en efectivo
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22 }}>
          <span style={{ color: '#d7f3ee' }}>mercatoma.vercel.app</span>
          <span style={{ color: '#d7f3ee' }}>Santiago de Cuba</span>
        </div>
      </div>
    ),
    size
  )
}

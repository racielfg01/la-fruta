import type { Metadata, Viewport } from 'next'
// import { Poppins, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
import { ThemeProvider } from '@/components/theme-provider'
import { SettingsApplicator } from '@/components/settings-applicator'
import { Toaster } from '@/components/ui/sonner'
import { HOME_TITLE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'
import { onboardingVisibilityScript } from '@/lib/onboarding-visibility'
import './globals.css'

// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-inter",
// });

// const playfair = Playfair_Display({
//   subsets: ["latin"],
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-playfair",
// });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'default',
  },
  manifest: '/manifest.json',
  icons: {
    // El navegador descargaba el PNG de 192 px (33 KB) solo para la pestaña.
    // Los iconos grandes siguen en el manifest, que es quien los necesita.
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'es_CU',
    siteName: SITE_NAME,
  },
  twitter: {
    card: 'summary_large_image',
  },
  // Sin reglas genéricas: el index/follow es el comportamiento por defecto.
  // Solo se pide a Googlebot que muestre miniaturas grandes en los resultados.
  robots: {
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#4a7c59',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background" suppressHydrationWarning>
      <body className={` font-sans antialiased`}>
        {/* Corre durante el parseo, antes del primer pintado: marca el documento
            si la sesión ya terminó la bienvenida para que CSS la oculte. */}
        <script dangerouslySetInnerHTML={{ __html: onboardingVisibilityScript() }} />
        {/* La bienvenida está en el HTML del servidor: next/image emite su
            propio preload con fetchPriority="high" para la imagen del paso 1. */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SettingsApplicator />
          <AuthProvider>
            {children}
          </AuthProvider>
          <Toaster richColors />
        </ThemeProvider>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

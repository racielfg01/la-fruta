import type { Metadata, Viewport } from 'next'
// import { Poppins, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/components/auth-provider'
import { ServiceWorkerRegister } from '@/components/service-worker-register'
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
  title: 'MercaToma - Fresh Farm Products Delivered',
  description: 'Discover the freshest fruits and agricultural products delivered straight to your doorstep. Farm-to-table quality with convenient home delivery.',
  keywords: ['fruits', 'farm products', 'organic', 'delivery', 'fresh produce'],
  // generator: 'v0.app',
  applicationName: 'MercaToma',
  appleWebApp: {
    capable: true,
    title: 'MercaToma',
    statusBarStyle: 'default',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/favicon.ico',
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
    <html lang="en" className="bg-background">
      <body className={` font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ServiceWorkerRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

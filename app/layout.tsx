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
  title: 'La Fruta - Fresh Farm Products Delivered',
  description: 'Discover the freshest fruits and agricultural products delivered straight to your doorstep. Farm-to-table quality with convenient home delivery.',
  keywords: ['fruits', 'farm products', 'organic', 'delivery', 'fresh produce'],
  generator: 'v0.app',
  applicationName: 'La Fruta',
  appleWebApp: {
    capable: true,
    title: 'La Fruta',
    statusBarStyle: 'default',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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

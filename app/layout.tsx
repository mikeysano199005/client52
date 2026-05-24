import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: 'StreamZone - Premium OTT Subscriptions',
  description: 'Buy Netflix, Amazon Prime, Hotstar & more at the best prices. Instant delivery, 100% genuine.',
  keywords: 'Netflix subscription, Amazon Prime, Hotstar, OTT plans, buy OTT subscription India',
  openGraph: {
    title: 'StreamZone - Premium OTT Subscriptions',
    description: 'Best prices on Netflix, Prime, Hotstar & more. Instant delivery guaranteed.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-[#09090b] text-zinc-100 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: '10px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#18181b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
          }}
        />
      </body>
    </html>
  )
}

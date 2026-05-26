import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import ThemedToaster from '@/components/ui/ThemedToaster'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#09090b',
}

export const metadata: Metadata = {
  title: 'DIGITAL OTT - Premium OTT Subscriptions',
  description: 'Buy Netflix, Amazon Prime, Hotstar & more at the best prices. Instant delivery, 100% genuine.',
  keywords: 'Netflix subscription, Amazon Prime, Hotstar, OTT plans, buy OTT subscription India',
  openGraph: {
    title: 'DIGITAL OTT - Premium OTT Subscriptions',
    description: 'Best prices on Netflix, Prime, Hotstar & more. Instant delivery guaranteed.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {/* Prevent flash: apply saved theme before React hydrates */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('sz-theme');if(t==='light')document.documentElement.classList.add('light')}catch(e){}})()` }}
        />
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

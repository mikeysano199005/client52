import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

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
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      {/* Prevent flash: apply saved theme before React hydrates */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('sz-theme');if(t==='light')document.documentElement.classList.add('light')}catch(e){}})()` }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
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
        </ThemeProvider>
      </body>
    </html>
  )
}

'use client'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function ThemedToaster() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: dark ? '#18181b' : '#ffffff',
          color: dark ? '#f4f4f5' : '#18181b',
          border: dark ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(139,92,246,0.25)',
          borderRadius: '10px',
          boxShadow: dark ? undefined : '0 4px 16px rgba(0,0,0,0.08)',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: dark ? '#18181b' : '#ffffff' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: dark ? '#18181b' : '#ffffff' },
        },
      }}
    />
  )
}

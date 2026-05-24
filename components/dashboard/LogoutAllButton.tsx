'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LogoutAllButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogoutAll() {
    if (!confirm('This will sign you out from ALL devices including this one. Continue?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/auth/logout-all', { method: 'POST' })
      if (res.ok) {
        toast.success('Signed out from all devices')
        router.push('/login')
        router.refresh()
      } else {
        toast.error('Failed to logout all devices')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogoutAll}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
    >
      {loading
        ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
        : <LogOut className="w-4 h-4" />
      }
      {loading ? 'Signing out...' : 'Logout from All Devices'}
    </button>
  )
}

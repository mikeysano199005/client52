'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronLeft, RefreshCw, Copy, Eye, EyeOff } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { getPlanLogo } from '@/lib/logos'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const STEPS = [
  { key: 'payment_submitted', label: 'Payment\nSubmitted' },
  { key: 'under_verification', label: 'Under\nVerification' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
]

const POLL_INTERVAL = 8000

interface UserData { name: string; role: string; wallet_balance: number }
type FullOrder = Order & {
  account_stock: { email: string; password: string; profile_number?: string; extra_info?: string } | null
}

export default function OrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [orders, setOrders] = useState<FullOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [showPw, setShowPw] = useState<Record<string, boolean>>({})
  const prevStatusRef = useRef<Record<string, string>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/orders')
      if (!res.ok) { router.push('/login'); return }
      const { orders: fresh } = await res.json()

      // Detect status changes and notify
      const prev = prevStatusRef.current
      for (const o of fresh as FullOrder[]) {
        if (prev[o.id] && prev[o.id] !== o.status) {
          const label = ORDER_STATUS_LABELS[o.status] || o.status
          if (o.status === 'delivered') {
            toast.success(`🎉 ${o.plan_name} has been delivered!`, { duration: 6000 })
          } else {
            toast(`${o.plan_name} → ${label}`, { icon: '🔔' })
          }
        }
        prev[o.id] = o.status
      }
      prevStatusRef.current = prev

      setOrders(fresh)
      setLastUpdated(new Date())
    } finally {
      if (!silent) setLoading(false)
    }
  }, [router])

  // Load user + orders on mount, then poll
  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const { user: u } = await res.json()
      if (!u) { router.push('/login'); return }
      setUser(u)
      await fetchOrders()
    }
    init()
  }, [fetchOrders, router])

  useEffect(() => {
    timerRef.current = setInterval(() => fetchOrders(true), POLL_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [fetchOrders])

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-purple-400" />
              My Orders
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-[10px] text-zinc-600 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchOrders()}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-[11px] text-zinc-500">Live — updates every 8 seconds</span>
        </div>

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-36 skeleton rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="glass rounded-2xl p-8 sm:p-16 text-center">
            <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No orders yet</h2>
            <p className="text-zinc-500 mb-6">Start browsing our amazing OTT plans</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all">
              Browse Plans
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentIdx = STEPS.findIndex(s => s.key === order.status)
              const account = order.account_stock
              const isActive = !['delivered', 'cancelled'].includes(order.status)

              return (
                <div
                  key={order.id}
                  className={`glass rounded-xl overflow-hidden transition-all ${
                    isActive ? 'border border-purple-500/20' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111113] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                        {getPlanLogo(order.plan_name) ? (
                          <img src={getPlanLogo(order.plan_name)!} alt={order.plan_name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-sm font-black text-white">{order.plan_name[0]}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{order.plan_name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          #{order.order_number} • {formatDateTime(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'text-zinc-400 bg-zinc-400/10'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                      <p className="text-sm font-bold text-white mt-1">{formatPrice(order.amount)}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {order.status !== 'cancelled' && (
                    <div className="px-4 py-4 border-b border-white/10">
                      <div className="flex items-start">
                        {STEPS.map((step, i) => (
                          <div key={step.key} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center min-w-0 w-full">
                              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                                i < currentIdx
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : i === currentIdx
                                  ? 'border-purple-500 text-purple-400 bg-purple-500/10 animate-pulse-glow'
                                  : 'border-zinc-700 text-zinc-600'
                              }`}>
                                {i < currentIdx ? '✓' : i + 1}
                              </div>
                              <p className={`text-[9px] sm:text-[10px] mt-1 text-center leading-tight whitespace-pre-line px-0.5 ${
                                i <= currentIdx ? 'text-purple-400' : 'text-zinc-600'
                              }`}>
                                {step.label}
                              </p>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`flex-1 h-px mx-1 mb-4 transition-all duration-500 shrink ${
                                i < currentIdx ? 'bg-purple-600' : 'bg-zinc-800'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="px-5 py-3 border-b border-white/10">
                      <p className="text-xs text-red-400">This order has been cancelled.</p>
                    </div>
                  )}

                  {/* Credentials (delivered) */}
                  {order.status === 'delivered' && account && (
                    <div className="px-5 py-4 bg-green-500/5 border-b border-green-500/15">
                      <p className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider">
                        ✅ Your Account Credentials
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-zinc-500 mb-0.5">Email</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-mono text-white truncate">{account.email}</p>
                            <button onClick={() => copyText(account.email, 'Email')} className="text-zinc-500 hover:text-purple-400 shrink-0 transition-colors">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-zinc-500 mb-0.5">Password</p>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-mono text-white truncate">
                              {showPw[order.id] ? account.password : '••••••••'}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setShowPw(p => ({ ...p, [order.id]: !p[order.id] }))} className="text-zinc-500 hover:text-zinc-300 transition-colors">
                                {showPw[order.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => copyText(account.password, 'Password')} className="text-zinc-500 hover:text-purple-400 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        {account.profile_number && (
                          <div className="bg-white/5 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-zinc-500 mb-0.5">Profile</p>
                            <p className="text-sm font-mono text-white">{account.profile_number}</p>
                          </div>
                        )}
                        {account.extra_info && (
                          <div className="bg-white/5 rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-zinc-500 mb-0.5">Additional Info</p>
                            <p className="text-sm text-white">{account.extra_info}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-amber-400 mt-3">
                        ⚠️ Do NOT share these credentials or change the account password/email
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-5 py-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>Plan: {(order.plan_variant as { label?: string })?.label || '—'}</span>
                    <span>Wallet used: {formatPrice(order.wallet_used)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

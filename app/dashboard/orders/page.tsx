import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { Package, ChevronLeft } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import { getPlanLogo } from '@/lib/logos'
import type { Order } from '@/types'

const STEPS = [
  { key: 'payment_submitted', label: 'Payment Submitted' },
  { key: 'under_verification', label: 'Under Verification' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
]

export default async function OrdersPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const { data } = await supabaseAdmin
    .from('orders')
    .select('*, account_stock(email, password, profile_number, extra_info)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (data || []) as (Order & { account_stock: { email: string; password: string; profile_number: string; extra_info: string } | null })[]

  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, role: user.role, wallet_balance: user.wallet_balance }} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-400" />
            My Orders
          </h1>
        </div>

        {orders.length === 0 ? (
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
              const currentIdx = STEPS.findIndex((s) => s.key === order.status)
              const account = order.account_stock
              return (
                <div key={order.id} className="glass rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-900/60 to-zinc-900 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                        {getPlanLogo(order.plan_name) ? (
                          <img src={getPlanLogo(order.plan_name)!} alt={order.plan_name} className="w-full h-full object-contain" />
                        ) : <span className="text-sm font-black text-white">{order.plan_name[0]}</span>}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{order.plan_name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">#{order.order_number} • {formatDateTime(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'text-zinc-400 bg-zinc-400/10'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                      <p className="text-sm font-bold text-white mt-1">{formatPrice(order.amount)}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  {order.status !== 'cancelled' && (
                    <div className="px-5 py-4 border-b border-white/10">
                      <div className="flex items-center gap-0">
                        {STEPS.map((step, i) => (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                                i < currentIdx
                                  ? 'bg-purple-600 border-purple-600 text-white'
                                  : i === currentIdx
                                  ? 'border-purple-500 text-purple-400 animate-pulse-glow'
                                  : 'border-zinc-700 text-zinc-600'
                              }`}>
                                {i < currentIdx ? '✓' : i + 1}
                              </div>
                              <p className={`text-[10px] mt-1 text-center w-20 leading-tight ${i <= currentIdx ? 'text-purple-400' : 'text-zinc-600'}`}>
                                {step.label}
                              </p>
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < currentIdx ? 'bg-purple-600' : 'bg-zinc-800'}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Credentials (only when delivered) */}
                  {order.status === 'delivered' && account && (
                    <div className="px-5 py-4 bg-green-500/5 border-b border-green-500/20">
                      <p className="text-xs font-semibold text-green-400 mb-3 uppercase tracking-wider">✅ Your Account Credentials</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-zinc-500">Email</p>
                          <p className="text-sm font-mono text-white">{account.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Password</p>
                          <p className="text-sm font-mono text-white">{account.password}</p>
                        </div>
                        {account.profile_number && (
                          <div>
                            <p className="text-xs text-zinc-500">Profile Number</p>
                            <p className="text-sm font-mono text-white">{account.profile_number}</p>
                          </div>
                        )}
                        {account.extra_info && (
                          <div>
                            <p className="text-xs text-zinc-500">Additional Info</p>
                            <p className="text-sm text-white">{account.extra_info}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-amber-400 mt-3">⚠️ Do NOT share these credentials or change account settings</p>
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

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import {
  ShoppingBag, Wallet, Users, Copy, ExternalLink,
  TrendingUp, Clock, CheckCircle, Package
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Order } from '@/types'

export default async function DashboardPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const [ordersRes, txnsRes, referralRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('referrals').select('*').eq('referrer_id', user.id),
  ])

  const orders = (ordersRes.data || []) as Order[]
  const referrals = referralRes.data || []
  const totalSpent = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.amount, 0)

  const statusCounts = {
    pending: orders.filter((o) => ['payment_submitted', 'under_verification', 'processing'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  }

  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, role: user.role, wallet_balance: user.wallet_balance }} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Manage your subscriptions and account</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Orders', value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Active Orders', value: statusCounts.pending, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Delivered', value: statusCounts.delivered, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400', bg: 'bg-green-400/10' },
            { label: 'Total Spent', value: formatPrice(totalSpent), icon: <TrendingUp className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center ${s.color} mb-3`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" />
                Recent Orders
              </h2>
              <Link href="/dashboard/orders" className="text-xs text-purple-400 hover:text-purple-300">
                View All
              </Link>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No orders yet</p>
                <Link href="/" className="text-purple-400 text-sm hover:text-purple-300 mt-2 inline-block">
                  Browse Plans →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {orders.map((order) => (
                  <div key={order.id} className="px-5 py-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 mr-4">
                        <p className="text-sm font-medium text-white truncate">{order.plan_name}</p>
                        <p className="text-xs text-zinc-500"># {order.order_number}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status] || 'text-zinc-400 bg-zinc-400/10'}`}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                        <p className="text-xs text-zinc-500 mt-1">{formatDateTime(order.created_at)}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3">
                      <OrderProgressBar status={order.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Wallet + Referral */}
          <div className="space-y-4">
            {/* Wallet */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-purple-400" />
                <h2 className="font-bold text-white">Wallet</h2>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-cyan-600/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-zinc-400 mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-white">{formatPrice(user.wallet_balance)}</p>
              </div>
              <Link
                href="/dashboard/wallet"
                className="block text-center py-2.5 border border-white/20 hover:border-purple-500/50 text-sm text-zinc-300 hover:text-purple-400 rounded-xl transition-all"
              >
                Wallet History →
              </Link>
            </div>

            {/* Referral */}
            <div className="glass rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-cyan-400" />
                <h2 className="font-bold text-white">Referral Program</h2>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Invite friends and earn <span className="text-purple-400 font-semibold">₹20</span> for every purchase they make!
              </p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
                <p className="text-xs text-zinc-500 mb-1">Your Referral Code</p>
                <div className="flex items-center justify-between">
                  <code className="text-lg font-bold text-purple-400">{user.referral_code}</code>
                  <button
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white"
                    title="Copy code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Total Referrals</span>
                <span className="text-white font-semibold">{referrals.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-zinc-500">Earned</span>
                <span className="text-green-400 font-semibold">
                  {formatPrice(referrals.filter((r) => r.status === 'credited').reduce((s: number, r: { reward_amount: number }) => s + r.reward_amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  )
}

function OrderProgressBar({ status }: { status: string }) {
  const steps = ['payment_submitted', 'under_verification', 'processing', 'delivered']
  const currentIdx = status === 'cancelled' ? -1 : steps.indexOf(status)

  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-red-400">Cancelled</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${i <= currentIdx ? 'bg-purple-500' : 'bg-zinc-700'}`} />
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-purple-500' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

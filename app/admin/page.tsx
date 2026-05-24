import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import {
  ShoppingBag, Users, TrendingUp, Clock, CheckCircle,
  Bell, ArrowRight, Package, Database
} from 'lucide-react'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Order } from '@/types'

export default async function AdminDashboard() {
  const user = await getSession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [ordersRes, usersRes, notifRes, stockRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('users').select('id, created_at').eq('role', 'user'),
    supabaseAdmin.from('notifications').select('*').eq('read', false).order('created_at', { ascending: false }).limit(5),
    supabaseAdmin.from('account_stock').select('status, plan_id'),
  ])

  const orders = (ordersRes.data || []) as Order[]
  const users = usersRes.data || []
  const notifications = notifRes.data || []

  const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.amount), 0)
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= today)
  const todayRevenue = todayOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.amount), 0)
  const pendingOrders = orders.filter((o) => ['payment_submitted', 'under_verification', 'processing'].includes(o.status))
  const stockItems = stockRes.data || []
  const availableStock = stockItems.filter((s) => s.status === 'available').length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        {notifications.length > 0 && (
          <div className="relative">
            <Bell className="w-6 h-6 text-zinc-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Orders', value: orders.length, sub: `+${todayOrders.length} today`, icon: <ShoppingBag className="w-5 h-5" />, color: 'purple' },
          { label: 'Total Revenue', value: formatPrice(totalRevenue), sub: `+${formatPrice(todayRevenue)} today`, icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
          { label: 'Total Users', value: users.length, sub: 'registered users', icon: <Users className="w-5 h-5" />, color: 'cyan' },
          { label: 'Pending Orders', value: pendingOrders.length, sub: 'need action', icon: <Clock className="w-5 h-5" />, color: 'amber' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-5">
            <div className={`w-10 h-10 rounded-xl bg-${s.color}-400/10 flex items-center justify-center text-${s.color}-400 mb-3`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
            <p className="text-xs text-zinc-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Orders ({pendingOrders.length})
            </h2>
            <Link href="/admin/orders" className="text-xs text-purple-400 hover:text-purple-300">
              View All <ArrowRight className="inline w-3 h-3" />
            </Link>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">All orders processed!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {pendingOrders.slice(0, 8).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders?id=${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0 mr-4">
                    <p className="text-sm text-white truncate">{order.plan_name}</p>
                    <p className="text-xs text-zinc-500">#{order.order_number} • {formatDateTime(order.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1">{formatPrice(order.amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stock alert */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-purple-400" />
              <h2 className="font-bold text-white text-sm">Account Stock</h2>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-zinc-400 text-sm">Available</span>
              <span className={`font-bold text-sm ${availableStock < 10 ? 'text-red-400' : 'text-green-400'}`}>
                {availableStock} accounts
              </span>
            </div>
            {availableStock < 10 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400">
                ⚠️ Low stock! Upload more accounts.
              </div>
            )}
            <Link href="/admin/stock" className="block mt-3 text-center text-xs text-purple-400 hover:text-purple-300">
              Manage Stock →
            </Link>
          </div>

          {/* Quick actions */}
          <div className="glass rounded-xl p-5">
            <h2 className="font-bold text-white text-sm mb-3">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/admin/plans', label: 'Add New Plan', icon: <Package className="w-3.5 h-3.5" /> },
                { href: '/admin/orders', label: 'Process Orders', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                { href: '/admin/stock', label: 'Add Stock', icon: <Database className="w-3.5 h-3.5" /> },
                { href: '/admin/coupons', label: 'Create Coupon', icon: <CheckCircle className="w-3.5 h-3.5" /> },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <span className="text-purple-400">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

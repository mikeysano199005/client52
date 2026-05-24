'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingBag, Users, Wallet, BarChart2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Analytics {
  total_revenue: number
  today_revenue: number
  week_revenue: number
  month_revenue: number
  total_orders: number
  today_orders: number
  total_users: number
  pending_orders: number
  delivered_orders: number
  cancelled_orders: number
  top_plans: { plan_name: string; count: number; revenue: number }[]
  daily: { date: string; revenue: number; orders: number }[]
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-800 rounded-xl animate-pulse" />)}
    </div>
  )

  if (!data) return null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Business performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Revenue', value: formatPrice(data.total_revenue), icon: <TrendingUp className="w-5 h-5" />, color: 'text-purple-400' },
          { label: "Today's Revenue", value: formatPrice(data.today_revenue), icon: <Wallet className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'This Month', value: formatPrice(data.month_revenue), icon: <BarChart2 className="w-5 h-5" />, color: 'text-cyan-400' },
          { label: 'Total Orders', value: data.total_orders.toString(), icon: <ShoppingBag className="w-5 h-5" />, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-5">
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Delivered', count: data.delivered_orders, color: 'bg-green-500' },
              { label: 'Pending', count: data.pending_orders, color: 'bg-yellow-500' },
              { label: 'Cancelled', count: data.cancelled_orders, color: 'bg-red-500' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-400">{s.label}</span>
                  <span className="text-white font-medium">{s.count}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: data.total_orders ? `${(s.count / data.total_orders) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-4">Top Selling Plans</h2>
          <div className="space-y-3">
            {data.top_plans.length === 0 ? (
              <p className="text-zinc-500 text-sm">No orders yet.</p>
            ) : data.top_plans.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-4">#{i + 1}</span>
                  <span className="text-sm text-zinc-300 truncate max-w-[160px]">{p.plan_name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{formatPrice(p.revenue)}</p>
                  <p className="text-xs text-zinc-500">{p.count} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Last 7 Days</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="pb-2 text-zinc-400 font-medium">Date</th>
                <th className="pb-2 text-zinc-400 font-medium">Orders</th>
                <th className="pb-2 text-zinc-400 font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.daily.map((d) => (
                <tr key={d.date}>
                  <td className="py-2 text-zinc-400">{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="py-2 text-white">{d.orders}</td>
                  <td className="py-2 text-green-400 font-medium">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

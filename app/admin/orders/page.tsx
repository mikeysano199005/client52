'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, ChevronDown, X, Send, CheckCircle } from 'lucide-react'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'payment_submitted', 'under_verification', 'processing', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    const res = await fetch('/api/admin/orders')
    if (res.ok) {
      const { orders } = await res.json()
      setOrders(orders)
    }
    setLoading(false)
  }

  async function updateOrderStatus(orderId: string, status: string) {
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    })
    if (res.ok) {
      toast.success('Order updated!')
      await loadOrders()
      setSelected(null)
    } else {
      toast.error('Failed to update order')
    }
    setUpdating(false)
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.order_number.includes(search.toUpperCase()) || o.plan_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, plan name..."
            className="input-dark pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-dark w-auto min-w-40"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? 'All Statuses' : ORDER_STATUS_LABELS[s] || s}
            </option>
          ))}
        </select>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: orders.length, color: 'text-white' },
          { label: 'Pending', value: orders.filter((o) => ['payment_submitted', 'under_verification', 'processing'].includes(o.status)).length, color: 'text-amber-400' },
          { label: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length, color: 'text-green-400' },
          { label: 'Revenue', value: formatPrice(orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.amount), 0)), color: 'text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-3 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-zinc-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Order #', 'Plan', 'Amount', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No orders found</td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-zinc-400">#{order.order_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-white">{order.plan_name}</p>
                      <p className="text-xs text-zinc-500">{(order.plan_variant as { label?: string })?.label}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{formatPrice(Number(order.amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] || 'text-zinc-400 bg-zinc-400/10'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { setSelected(order); setAdminNotes(order.admin_notes || '') }}
                        className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 rounded-lg transition-all"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="font-bold text-white">Order #{selected.order_number}</h2>
                <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-zinc-500 text-xs">Plan</p><p className="text-white font-medium">{selected.plan_name}</p></div>
                  <div><p className="text-zinc-500 text-xs">Amount</p><p className="text-white font-bold">{formatPrice(Number(selected.amount))}</p></div>
                  <div><p className="text-zinc-500 text-xs">Payment UTR</p><p className="text-white font-mono text-xs">{selected.payment_utr || '—'}</p></div>
                  <div><p className="text-zinc-500 text-xs">Current Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[selected.status]}`}>
                      {ORDER_STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                </div>

                {selected.payment_proof_url && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-2">Payment Proof</p>
                    <a href={selected.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-purple-400 text-sm hover:underline">
                      View Screenshot →
                    </a>
                  </div>
                )}

                {selected.notes && (
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">Customer Notes</p>
                    <p className="text-sm text-zinc-300">{selected.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-zinc-500 text-xs block mb-1.5">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    className="input-dark resize-none"
                    placeholder="Internal notes..."
                  />
                </div>

                {/* Status buttons */}
                <div>
                  <p className="text-zinc-500 text-xs mb-2">Update Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['under_verification', 'processing', 'delivered', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        disabled={updating || selected.status === s}
                        onClick={() => updateOrderStatus(selected.id, s)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          s === 'delivered'
                            ? 'bg-green-600 hover:bg-green-500 text-white'
                            : s === 'cancelled'
                            ? 'bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30'
                            : 'bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

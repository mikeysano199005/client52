'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, X, CheckCircle, Package, User, Eye, EyeOff, ChevronRight, ChevronDown, RotateCcw,
  BadgeDollarSign, RefreshCcw, AlertTriangle
} from 'lucide-react'
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils'
import type { Order } from '@/types'
import toast from 'react-hot-toast'

const STATUSES = ['all', 'payment_submitted', 'under_verification', 'processing', 'delivered', 'cancelled']

interface StockAccount {
  id: string
  email: string
  password: string
  profile_number?: string
  extra_info?: string
  variant_label?: string
}

type OrderWithAccount = Order & {
  account_stock?: { email: string; password: string; profile_number?: string; extra_info?: string } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selected, setSelected] = useState<OrderWithAccount | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)

  // Delivery sub-step
  const [deliverStep, setDeliverStep] = useState(false)
  const [redeliverMode, setRedeliverMode] = useState(false)
  const [availableStock, setAvailableStock] = useState<StockAccount[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [pickedAccount, setPickedAccount] = useState<StockAccount | null>(null)
  const [showPw, setShowPw] = useState<Record<string, boolean>>({})

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // Reload from page 1 when filters change
  const filterRef = useRef({ search: debouncedSearch, status: statusFilter })
  useEffect(() => {
    filterRef.current = { search: debouncedSearch, status: statusFilter }
    setPage(1)
    setHasMore(false)
    fetchOrders(1, debouncedSearch, statusFilter, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter])

  async function fetchOrders(pageNum: number, srch: string, status: string, append: boolean) {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ page: String(pageNum) })
    if (status && status !== 'all') params.set('status', status)
    if (srch) params.set('search', srch)

    const res = await fetch(`/api/admin/orders?${params}`)
    if (res.ok) {
      const { orders: newOrders, total: t, hasMore: more } = await res.json()
      setOrders(prev => append ? [...prev, ...newOrders] : newOrders)
      setTotal(t)
      setHasMore(more)
    }

    if (!append) setLoading(false)
    else setLoadingMore(false)
  }

  async function loadMore() {
    const next = page + 1
    setPage(next)
    await fetchOrders(next, filterRef.current.search, filterRef.current.status, true)
  }

  // Refresh from page 1 with current filters (called after order updates)
  async function refreshOrders() {
    setPage(1)
    setHasMore(false)
    await fetchOrders(1, filterRef.current.search, filterRef.current.status, false)
  }

  function openModal(order: OrderWithAccount) {
    setSelected(order)
    setAdminNotes(order.admin_notes || '')
    setDeliverStep(false)
    setRedeliverMode(false)
    setPickedAccount(null)
    setAvailableStock([])
  }

  function closeModal() {
    setSelected(null)
    setDeliverStep(false)
    setRedeliverMode(false)
    setPickedAccount(null)
  }

  const loadStock = useCallback(async (planId: string) => {
    setStockLoading(true)
    const res = await fetch(`/api/admin/stock?plan_id=${planId}&status=available`)
    if (res.ok) { const { stock } = await res.json(); setAvailableStock(stock) }
    setStockLoading(false)
  }, [])

  function startDeliver(redeliver = false) {
    if (!selected) return
    setDeliverStep(true)
    setRedeliverMode(redeliver)
    loadStock(selected.plan_id)
  }

  async function confirmDeliver() {
    if (!selected) return
    if (!pickedAccount && availableStock.length > 0) {
      toast.error('Pick an account to deliver')
      return
    }
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'delivered',
        admin_notes: adminNotes,
        account_id: pickedAccount?.id || null,
        force_reassign: redeliverMode,
      }),
    })
    if (res.ok) {
      toast.success(redeliverMode ? 'Credentials reassigned & resent!' : 'Order delivered! Credentials sent to customer.')
      await refreshOrders()
      closeModal()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed to deliver')
    }
    setUpdating(false)
  }

  async function handleDismissRequest() {
    if (!selected) return
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss_request' }),
    })
    if (res.ok) {
      toast.success('Request dismissed.')
      await refreshOrders()
      closeModal()
    } else toast.error('Failed to dismiss')
    setUpdating(false)
  }

  async function handleRefund() {
    if (!selected) return
    if (!confirm(`Refund ₹${selected.amount} to customer wallet and cancel this order?`)) return
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'refund', admin_notes: adminNotes }),
    })
    if (res.ok) {
      toast.success(`₹${selected.amount} refunded to wallet. Order cancelled.`)
      await refreshOrders()
      closeModal()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Refund failed')
    }
    setUpdating(false)
  }

  async function updateStatus(status: string) {
    if (!selected) return
    setUpdating(true)
    const res = await fetch(`/api/admin/orders/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes: adminNotes }),
    })
    if (res.ok) {
      toast.success('Order updated!')
      await refreshOrders()
      closeModal()
    } else toast.error('Failed to update')
    setUpdating(false)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Orders</h1>

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, plan name..." className="input-dark pl-9" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-dark w-auto min-w-40">
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : ORDER_STATUS_LABELS[s] || s}</option>)}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: total, color: 'text-white' },
          { label: 'Pending', value: orders.filter(o => ['payment_submitted','under_verification','processing'].includes(o.status)).length, color: 'text-amber-400' },
          { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-400' },
          { label: 'Revenue', value: formatPrice(orders.filter(o => o.status === 'delivered').reduce((s, o) => s + Number(o.amount), 0)), color: 'text-purple-400' },
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
                {['Order #', 'Plan', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>
                  ))}</tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-zinc-500">No orders found</td></tr>
              ) : (
                orders.map((order: OrderWithAccount) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        {(order.refund_requested || order.replacement_requested) && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title={order.refund_requested ? 'Refund requested' : 'Replacement requested'} />
                        )}
                        #{order.order_number}
                      </div>
                    </td>
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
                      <button onClick={() => openModal(order)}
                        className="px-3 py-1.5 text-xs bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 rounded-lg transition-all">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="px-4 py-4 border-t border-white/5 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-sm rounded-xl transition-all disabled:opacity-50"
            >
              {loadingMore
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Loading...</>
                : <><ChevronDown className="w-4 h-4" /> Load More</>}
            </button>
            <p className="text-xs text-zinc-600 mt-2">Showing {orders.length} of {total} orders</p>
          </div>
        )}
        {!hasMore && !loading && orders.length > 0 && (
          <p className="px-4 py-3 text-xs text-zinc-600 text-center border-t border-white/5">
            Showing all {orders.length} order{orders.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#111113] z-10">
                <h2 className="font-bold text-white">Order #{selected.order_number}</h2>
                <button onClick={closeModal} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-4">

                {/* ── Customer Request Alert ── */}
                {(selected.refund_requested || selected.replacement_requested) && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <p className="text-sm font-semibold text-amber-400">Customer Request Pending</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selected.refund_requested && (
                        <span className="flex items-center gap-1.5 text-xs px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 rounded-full font-medium">
                          <BadgeDollarSign className="w-3 h-3" /> Refund Requested
                        </span>
                      )}
                      {selected.replacement_requested && (
                        <span className="flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full font-medium">
                          <RefreshCcw className="w-3 h-3" /> Replacement Requested
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selected.refund_requested && (
                        <button
                          onClick={handleRefund}
                          disabled={updating}
                          className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <BadgeDollarSign className="w-3.5 h-3.5" />
                          Approve Refund
                        </button>
                      )}
                      {selected.replacement_requested && (
                        <button
                          onClick={() => startDeliver(true)}
                          disabled={updating}
                          className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          Start Replacement
                        </button>
                      )}
                      <button
                        onClick={handleDismissRequest}
                        disabled={updating}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-zinc-500 text-xs">Plan</p><p className="text-white font-medium">{selected.plan_name}</p></div>
                  <div><p className="text-zinc-500 text-xs">Amount</p><p className="text-white font-bold">{formatPrice(Number(selected.amount))}</p></div>
                  <div><p className="text-zinc-500 text-xs">Variant</p><p className="text-white text-xs">{(selected.plan_variant as { label?: string })?.label || '—'}</p></div>
                  <div>
                    <p className="text-zinc-500 text-xs">Status</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[selected.status]}`}>
                      {ORDER_STATUS_LABELS[selected.status]}
                    </span>
                  </div>
                  <div><p className="text-zinc-500 text-xs">Payment UTR</p><p className="text-white font-mono text-xs">{selected.payment_utr || '—'}</p></div>
                  <div><p className="text-zinc-500 text-xs">Date</p><p className="text-white text-xs">{formatDateTime(selected.created_at)}</p></div>
                </div>

                {selected.payment_proof_url && (
                  <a href={selected.payment_proof_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-purple-400 text-sm hover:underline">
                    <Eye className="w-3.5 h-3.5" /> View Payment Screenshot
                  </a>
                )}

                {selected.notes && (
                  <div className="bg-white/5 rounded-xl px-4 py-3">
                    <p className="text-zinc-500 text-xs mb-1">Customer Note</p>
                    <p className="text-sm text-zinc-300">{selected.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-zinc-500 text-xs block mb-1.5">Admin Notes</label>
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
                    rows={2} className="input-dark resize-none" placeholder="Internal notes..." />
                </div>

                {/* ── Delivered: show credentials ── */}
                {selected.status === 'delivered' && !deliverStep && (
                  <div className="space-y-3">
                    {selected.account_stock ? (
                      <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Delivered Credentials</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-zinc-500">Email</p>
                            <p className="text-white font-mono">{selected.account_stock.email}</p>
                          </div>
                          <div>
                            <p className="text-zinc-500">Password</p>
                            <p className="text-white font-mono">
                              {showPw['modal_cred'] ? selected.account_stock.password : '••••••••'}
                              <button onClick={() => setShowPw(p => ({ ...p, modal_cred: !p['modal_cred'] }))}
                                className="ml-1 text-zinc-600 hover:text-zinc-400 align-middle">
                                {showPw['modal_cred'] ? <EyeOff className="w-3 h-3 inline" /> : <Eye className="w-3 h-3 inline" />}
                              </button>
                            </p>
                          </div>
                          {selected.account_stock.profile_number && (
                            <div><p className="text-zinc-500">Profile</p><p className="text-white font-mono">{selected.account_stock.profile_number}</p></div>
                          )}
                          {selected.account_stock.extra_info && (
                            <div className="col-span-2"><p className="text-zinc-500">Extra Info</p><p className="text-white">{selected.account_stock.extra_info}</p></div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
                        ⚠️ No credentials assigned to this order
                      </div>
                    )}
                    <button onClick={() => startDeliver(true)}
                      className="w-full py-2 border border-purple-500/30 text-purple-400 hover:bg-purple-600/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      Reassign Credentials &amp; Resend Email
                    </button>
                  </div>
                )}

                {/* ── Delivery step ── */}
                {deliverStep ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                      <Package className="w-4 h-4" />
                      {redeliverMode ? 'Reassign & Resend Credentials' : 'Select Account to Deliver'}
                    </div>

                    {stockLoading ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
                      </div>
                    ) : availableStock.length === 0 ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                        <p className="text-sm text-red-400 font-medium">No stock available for this plan</p>
                        <p className="text-xs text-zinc-500 mt-1">Add accounts in Account Stock, then try again.</p>
                        <button onClick={confirmDeliver} disabled={updating}
                          className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-all disabled:opacity-50">
                          Deliver Anyway (no credentials)
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-zinc-500">{availableStock.length} account{availableStock.length !== 1 ? 's' : ''} available — pick one to send to customer:</p>
                        <div className="space-y-2">
                          {availableStock.map(acc => (
                            <button key={acc.id} onClick={() => setPickedAccount(acc)}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                pickedAccount?.id === acc.id
                                  ? 'bg-green-600/15 border-green-500/40'
                                  : 'bg-white/5 border-white/10 hover:border-purple-500/40'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 text-zinc-500 shrink-0" />
                                    <p className="text-sm font-mono text-white truncate">{acc.email}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500">
                                    <span className="flex items-center gap-1">
                                      {showPw[acc.id] ? acc.password : '••••••••'}
                                      <button onClick={e => { e.stopPropagation(); setShowPw(p => ({ ...p, [acc.id]: !p[acc.id] })) }}
                                        className="text-zinc-600 hover:text-zinc-400">
                                        {showPw[acc.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </button>
                                    </span>
                                    {acc.profile_number && <span className="text-zinc-600">Profile: {acc.profile_number}</span>}
                                    {acc.variant_label && <span className="text-zinc-600">{acc.variant_label}</span>}
                                  </div>
                                </div>
                                {pickedAccount?.id === acc.id && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                              </div>
                            </button>
                          ))}
                        </div>

                        {pickedAccount && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-xs text-green-400">
                            ✓ Will send: <strong>{pickedAccount.email}</strong> / {pickedAccount.password}
                            {pickedAccount.profile_number && ` / Profile: ${pickedAccount.profile_number}`}
                          </div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button onClick={() => { setDeliverStep(false); setPickedAccount(null) }}
                            className="flex-1 py-2.5 border border-white/20 text-zinc-400 hover:text-white rounded-xl text-sm transition-all">
                            Back
                          </button>
                          <button onClick={confirmDeliver} disabled={updating || !pickedAccount}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                            {updating
                              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Delivering...</>
                              : <><CheckCircle className="w-4 h-4" /> Deliver &amp; Send Credentials</>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : selected.status !== 'delivered' && (
                  /* ── Normal status buttons (hidden once delivered) ── */
                  <div>
                    <p className="text-zinc-500 text-xs mb-2">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(['under_verification', 'processing'] as const).map(s => (
                        <button key={s} disabled={updating || selected.status === s}
                          onClick={() => updateStatus(s)}
                          className="py-2 px-3 rounded-xl text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          {ORDER_STATUS_LABELS[s]}
                        </button>
                      ))}
                      {/* Delivered — triggers account picker */}
                      <button
                        disabled={updating}
                        onClick={() => startDeliver(false)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Delivered
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button disabled={updating || selected.status === 'cancelled'}
                        onClick={() => updateStatus('cancelled')}
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancelled
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Refund & Cancel ── */}
                {selected.status !== 'cancelled' && !deliverStep && (
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-zinc-500 text-xs mb-2">Danger Zone</p>
                    <button
                      onClick={handleRefund}
                      disabled={updating}
                      className="w-full py-2 border border-red-500/30 text-red-400 hover:bg-red-600/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund ₹{selected.amount} to Wallet &amp; Cancel
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

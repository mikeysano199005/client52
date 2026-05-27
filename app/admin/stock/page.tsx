'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Database, AlertTriangle, RotateCcw, XCircle, ChevronDown } from 'lucide-react'
import type { Plan } from '@/types'
import toast from 'react-hot-toast'

interface StockItem {
  id: string
  plan_id: string
  variant_label?: string
  email: string
  password: string
  profile_number?: string
  extra_info?: string
  status: 'available' | 'used' | 'expired' | 'reserved'
  added_at: string
  plans?: { name: string }
}

interface StockStats {
  available: number
  used: number
  total: number
}

export default function AdminStockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [stats, setStats] = useState<StockStats>({ available: 0, used: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const [showAdd, setShowAdd] = useState(false)
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('used')
  const [form, setForm] = useState({ plan_id: '', variant_label: '', email: '', password: '', profile_number: '', extra_info: '' })
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const filterRef = useRef({ plan: filterPlan, status: filterStatus })

  // Load plans once on mount
  useEffect(() => {
    fetch('/api/admin/plans')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.plans && setPlans(d.plans))
  }, [])

  // Reload stock when filters change
  useEffect(() => {
    filterRef.current = { plan: filterPlan, status: filterStatus }
    setPage(1)
    setHasMore(false)
    fetchStock(1, filterPlan, filterStatus, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPlan, filterStatus])

  async function fetchStock(pageNum: number, planId: string, status: string, append: boolean) {
    if (!append) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams({ page: String(pageNum) })
    if (planId) params.set('plan_id', planId)
    if (status && status !== 'all') params.set('status', status)

    const res = await fetch(`/api/admin/stock?${params}`)
    if (res.ok) {
      const { stock: newStock, total: t, hasMore: more, stats: s } = await res.json()
      setStock(prev => append ? [...prev, ...newStock] : newStock)
      setTotal(t)
      setHasMore(more)
      if (s) setStats(s)
    }

    if (!append) setLoading(false)
    else setLoadingMore(false)
  }

  async function loadMore() {
    const next = page + 1
    setPage(next)
    await fetchStock(next, filterRef.current.plan, filterRef.current.status, true)
  }

  async function refreshStock() {
    setPage(1)
    setHasMore(false)
    await fetchStock(1, filterRef.current.plan, filterRef.current.status, false)
  }

  async function addAccount() {
    if (!form.plan_id || !form.email || !form.password) {
      toast.error('Plan, email, and password are required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([form]),
    })
    if (res.ok) {
      toast.success('Account added!')
      setShowAdd(false)
      setForm({ plan_id: '', variant_label: '', email: '', password: '', profile_number: '', extra_info: '' })
      await refreshStock()
    } else {
      toast.error('Failed to add account')
    }
    setSaving(false)
  }

  async function bulkAdd() {
    if (!form.plan_id) { toast.error('Select a plan first'); return }
    const lines = bulkText.trim().split('\n').filter(Boolean)
    const items = lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim())
      return {
        plan_id: form.plan_id,
        variant_label: form.variant_label || null,
        email: parts[0] || '',
        password: parts[1] || '',
        profile_number: parts[2] || null,
        extra_info: parts[3] || null,
      }
    }).filter((i) => i.email && i.password)

    if (items.length === 0) { toast.error('No valid accounts found. Format: email|password|profile|extra'); return }

    setSaving(true)
    const res = await fetch('/api/admin/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    if (res.ok) {
      const { added } = await res.json()
      toast.success(`${added} accounts added!`)
      setShowAdd(false)
      setBulkText('')
      await refreshStock()
    } else {
      toast.error('Failed to add accounts')
    }
    setSaving(false)
  }

  async function deleteStock(id: string) {
    if (!confirm('Delete this account?')) return
    const res = await fetch('/api/admin/stock', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Deleted'); await refreshStock() }
    else { const d = await res.json(); toast.error(d.error || 'Failed to delete') }
  }

  async function updateStockStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/stock/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(`Marked as ${status}`)
      await refreshStock()
    } else {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Database className="w-6 h-6 text-purple-400" />
          Account Stock
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Accounts
        </button>
      </div>

      {/* Stats — global counts (accurate regardless of filter) */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{stats.available}</p>
          <p className="text-xs text-zinc-500 mt-1">Available</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-400">{stats.used}</p>
          <p className="text-xs text-zinc-500 mt-1">Used</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-zinc-500 mt-1">Total</p>
        </div>
      </div>

      {stats.available < 10 && stats.total > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">Low stock! Only {stats.available} accounts available. Please add more.</p>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4 mb-5 flex flex-wrap gap-3">
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="input-dark w-auto min-w-44">
          <option value="">All Plans</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-dark w-auto min-w-36">
          <option value="all">All Status</option>
          <option value="used">Used / Delivered</option>
          <option value="expired">Expired</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Plan', 'Variant', 'Email', 'Password', 'Profile', 'Status', 'Added', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>)}</tr>
                ))
              ) : stock.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No stock found</td></tr>
              ) : (
                stock.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{item.plans?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {item.variant_label
                        ? <span className="text-xs px-2 py-1 rounded-full bg-purple-600/20 text-purple-400 font-medium">{item.variant_label}</span>
                        : <span className="text-xs text-zinc-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-300">{item.email}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-400">{item.password}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{item.profile_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.status === 'available' ? 'text-green-400 bg-green-400/10' :
                        item.status === 'used'      ? 'text-blue-400 bg-blue-400/10'  :
                        item.status === 'expired'   ? 'text-red-400 bg-red-400/10'    :
                        'text-amber-400 bg-amber-400/10'
                      }`}>
                        {item.status === 'used' ? 'Delivered' : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {new Date(item.added_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {item.status === 'used' && (
                          <>
                            <button
                              onClick={() => updateStockStatus(item.id, 'expired')}
                              title="Mark as Expired"
                              className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => updateStockStatus(item.id, 'available')}
                              title="Mark as Available (still useable)"
                              className="p-1.5 text-zinc-600 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {item.status === 'expired' && (
                          <button
                            onClick={() => updateStockStatus(item.id, 'available')}
                            title="Restore as Available"
                            className="p-1.5 text-zinc-600 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => deleteStock(item.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            <p className="text-xs text-zinc-600 mt-2">Showing {stock.length} of {total} items</p>
          </div>
        )}
        {!hasMore && !loading && stock.length > 0 && (
          <p className="px-4 py-3 text-xs text-zinc-600 text-center border-t border-white/5">
            Showing all {stock.length} item{stock.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="font-bold text-white">Add Accounts</h2>
                <button onClick={() => setShowAdd(false)} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Plan *</label>
                  <select
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value, variant_label: '' })}
                    className="input-dark"
                  >
                    <option value="">Select Plan</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {form.plan_id && (() => {
                  const selectedPlan = plans.find(p => p.id === form.plan_id)
                  const variants = selectedPlan?.price_variants || []
                  return variants.length > 0 ? (
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Variant / Duration *</label>
                      <select
                        value={form.variant_label}
                        onChange={(e) => setForm({ ...form, variant_label: e.target.value })}
                        className="input-dark"
                      >
                        <option value="">— Select variant —</option>
                        {variants.map((v) => (
                          <option key={v.label} value={v.label}>{v.label} — {v.months} month{v.months > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-zinc-600 mt-1">Pick the duration this account covers so admin can match it to orders</p>
                    </div>
                  ) : null
                })()}

                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button onClick={() => setBulkMode(false)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!bulkMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
                    Single Account
                  </button>
                  <button onClick={() => setBulkMode(true)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${bulkMode ? 'bg-purple-600 text-white' : 'bg-white/5 text-zinc-400'}`}>
                    Bulk Upload
                  </button>
                </div>

                {!bulkMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email *</label>
                      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="account@email.com" className="input-dark" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Password *</label>
                      <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" className="input-dark" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Profile Number</label>
                      <input value={form.profile_number} onChange={(e) => setForm({ ...form, profile_number: e.target.value })} placeholder="Profile 1" className="input-dark" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-zinc-400 block mb-1.5">Extra Info</label>
                      <input value={form.extra_info} onChange={(e) => setForm({ ...form, extra_info: e.target.value })} placeholder="Any additional info" className="input-dark" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                      Paste accounts (one per line: email|password|profile|extra)
                    </label>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={8}
                      placeholder={`test1@gmail.com|pass123|Profile 1|HD\ntest2@gmail.com|pass456|Profile 2|HD`}
                      className="input-dark resize-none font-mono text-xs"
                    />
                    <p className="text-xs text-zinc-600 mt-1">{bulkText.split('\n').filter(Boolean).length} accounts detected</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowAdd(false)} className="flex-1 py-3 border border-white/20 text-zinc-400 hover:text-white rounded-xl transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={bulkMode ? bulkAdd : addAccount}
                    disabled={saving}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
                  >
                    {saving ? 'Adding...' : (bulkMode ? 'Bulk Add' : 'Add Account')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

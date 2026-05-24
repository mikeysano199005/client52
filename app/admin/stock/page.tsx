'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Upload, Database, CheckCircle, AlertTriangle } from 'lucide-react'
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
  status: 'available' | 'used' | 'reserved'
  added_at: string
  plans?: { name: string }
}

export default function AdminStockPage() {
  const [stock, setStock] = useState<StockItem[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filterPlan, setFilterPlan] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({ plan_id: '', variant_label: '', email: '', password: '', profile_number: '', extra_info: '' })
  const [bulkText, setBulkText] = useState('')
  const [bulkMode, setBulkMode] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const [stockRes, plansRes] = await Promise.all([
      fetch('/api/admin/stock'),
      fetch('/api/admin/plans'),
    ])
    if (stockRes.ok) { const { stock } = await stockRes.json(); setStock(stock) }
    if (plansRes.ok) { const { plans } = await plansRes.json(); setPlans(plans) }
    setLoading(false)
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
      await loadData()
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
      await loadData()
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
    if (res.ok) { toast.success('Deleted'); await loadData() }
  }

  const filtered = stock.filter((s) => {
    const matchPlan = !filterPlan || s.plan_id === filterPlan
    const matchStatus = filterStatus === 'all' || s.status === filterStatus
    return matchPlan && matchStatus
  })

  const available = stock.filter((s) => s.status === 'available').length
  const used = stock.filter((s) => s.status === 'used').length

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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{available}</p>
          <p className="text-xs text-zinc-500 mt-1">Available</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-zinc-400">{used}</p>
          <p className="text-xs text-zinc-500 mt-1">Used</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{stock.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Total</p>
        </div>
      </div>

      {available < 10 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-400">Low stock! Only {available} accounts available. Please add more.</p>
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
          <option value="available">Available</option>
          <option value="used">Used</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Plan', 'Email', 'Password', 'Profile', 'Status', 'Added', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No stock found</td></tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">{item.plans?.name || '—'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-300">{item.email}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-400">{item.password}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{item.profile_number || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        item.status === 'available' ? 'text-green-400 bg-green-400/10' :
                        item.status === 'used' ? 'text-zinc-500 bg-zinc-800' :
                        'text-amber-400 bg-amber-400/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">
                      {new Date(item.added_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'available' && (
                        <button onClick={() => deleteStock(item.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
                  <select value={form.plan_id} onChange={(e) => setForm({ ...form, plan_id: e.target.value })} className="input-dark">
                    <option value="">Select Plan</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Variant Label (optional)</label>
                  <input value={form.variant_label} onChange={(e) => setForm({ ...form, variant_label: e.target.value })} placeholder="e.g. 1 Month" className="input-dark" />
                </div>

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

'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Tag, ToggleLeft, ToggleRight } from 'lucide-react'
import type { Coupon } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { code: '', discount_type: 'flat' as 'flat' | 'percent', discount_value: '', min_order_amount: '', usage_limit: '1', first_order_only: false, expiry_at: '' }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCoupons() }, [])

  async function loadCoupons() {
    setLoading(true)
    const res = await fetch('/api/admin/coupons')
    if (res.ok) { const { coupons } = await res.json(); setCoupons(coupons) }
    setLoading(false)
  }

  async function saveCoupon() {
    if (!form.code || !form.discount_value) { toast.error('Code and discount value required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, discount_value: Number(form.discount_value), min_order_amount: Number(form.min_order_amount) || 0, usage_limit: Number(form.usage_limit) || 1 }),
    })
    if (res.ok) { toast.success('Coupon created!'); setShowForm(false); setForm(EMPTY); await loadCoupons() }
    else { const { error } = await res.json(); toast.error(error || 'Failed') }
    setSaving(false)
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Delete this coupon?')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Deleted'); await loadCoupons() }
  }

  async function toggleCoupon(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    })
    await loadCoupons()
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-400" />
          Coupons
        </h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all">
          <Plus className="w-4 h-4" />
          Create Coupon
        </button>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Code', 'Discount', 'Min Order', 'Usage', 'Expiry', 'Status', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>)}</tr>
                ))
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No coupons yet</td></tr>
              ) : (
                coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-purple-400">{c.code}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {c.discount_type === 'flat' ? formatPrice(c.discount_value) : `${c.discount_value}%`}
                      {c.first_order_only && <span className="ml-2 text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">First Order</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{c.used_count}/{c.usage_limit}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{c.expiry_at ? formatDate(c.expiry_at) : 'No expiry'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleCoupon(c)} className={`text-xs px-2 py-1 rounded-full font-medium ${c.active ? 'text-green-400 bg-green-400/10' : 'text-zinc-500 bg-zinc-800'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteCoupon(c.id)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-white/10 rounded-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-white">Create Coupon</h2>
                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Coupon Code *</label>
                  <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20" className="input-dark font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Discount Type</label>
                    <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'flat' | 'percent' })} className="input-dark">
                      <option value="flat">Flat (₹)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Value *</label>
                    <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === 'flat' ? '20' : '10'} className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Min Order (₹)</label>
                    <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} placeholder="0" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Usage Limit</label>
                    <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="1" className="input-dark" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Expiry Date (optional)</label>
                  <input type="datetime-local" value={form.expiry_at} onChange={(e) => setForm({ ...form, expiry_at: e.target.value })} className="input-dark" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.first_order_only} onChange={(e) => setForm({ ...form, first_order_only: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                  <span className="text-sm text-zinc-300">First order only</span>
                </label>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 py-3 border border-white/20 text-zinc-400 rounded-xl transition-all">Cancel</button>
                  <button onClick={saveCoupon} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all">
                    {saving ? 'Creating...' : 'Create'}
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

'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, LayoutGrid, Tv, Layers, Gamepad2, Shield, Zap, Star, Key, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Plan, PlanVariant } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getPlanLogo } from '@/lib/logos'

const CATEGORIES = [
  { label: 'All', icon: <LayoutGrid className="w-4 h-4" />, color: 'bg-zinc-700' },
  { label: 'OTT', icon: <Tv className="w-4 h-4" />, color: 'bg-purple-600' },
  { label: 'Combos', icon: <Layers className="w-4 h-4" />, color: 'bg-cyan-600' },
  { label: 'Games', icon: <Gamepad2 className="w-4 h-4" />, color: 'bg-green-600' },
  { label: 'VPN', icon: <Shield className="w-4 h-4" />, color: 'bg-blue-600' },
  { label: 'Utilities', icon: <Zap className="w-4 h-4" />, color: 'bg-orange-500' },
  { label: 'Premium', icon: <Star className="w-4 h-4" />, color: 'bg-amber-500' },
  { label: 'Digital Keys', icon: <Key className="w-4 h-4" />, color: 'bg-pink-600' },
]

interface InlineEdit {
  planId: string
  variantIdx: number
  field: 'price' | 'original_price'
  value: string
}

export default function AdminProductsPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState({ name: '', category: 'OTT', description: '', badge: '', featured: false, active: true, sort_order: 0, price_variants: [{ label: '1 Month', months: 1, price: 0, original_price: 0, quality: '1080p HD', access: '1 Screen' }] as PlanVariant[] })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    setLoading(true)
    const res = await fetch('/api/admin/plans')
    if (res.ok) { const { plans } = await res.json(); setPlans(plans) }
    setLoading(false)
  }

  const filtered = activeCategory === 'All' ? plans : plans.filter(p => p.category === activeCategory)

  function startEdit(planId: string, variantIdx: number, field: 'price' | 'original_price', value: number) {
    setInlineEdit({ planId, variantIdx, field, value: String(value) })
  }

  async function saveInlineEdit() {
    if (!inlineEdit) return
    const plan = plans.find(p => p.id === inlineEdit.planId)
    if (!plan) return
    const updated = plan.price_variants.map((v, i) =>
      i === inlineEdit.variantIdx ? { ...v, [inlineEdit.field]: Number(inlineEdit.value) } : v
    )
    const res = await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_variants: updated }),
    })
    if (res.ok) {
      toast.success('Price updated')
      setInlineEdit(null)
      loadPlans()
    } else {
      toast.error('Failed to update')
    }
  }

  async function toggleActive(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    })
    loadPlans()
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return
    await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    toast.success('Deleted')
    loadPlans()
  }

  function openAdd() {
    setEditingPlan(null)
    setForm({ name: '', category: activeCategory === 'All' ? 'OTT' : activeCategory, description: '', badge: '', featured: false, active: true, sort_order: plans.length, price_variants: [{ label: '1 Month', months: 1, price: 0, original_price: 0, quality: '1080p HD', access: '1 Screen' }] })
    setShowModal(true)
  }

  function openEdit(plan: Plan) {
    setEditingPlan(plan)
    setForm({ name: plan.name, category: plan.category, description: plan.description || '', badge: plan.badge || '', featured: plan.featured, active: plan.active, sort_order: plan.sort_order, price_variants: plan.price_variants })
    setShowModal(true)
  }

  async function savePlan() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    setSaving(true)
    const method = editingPlan ? 'PATCH' : 'POST'
    const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success(editingPlan ? 'Updated!' : 'Created!'); setShowModal(false); loadPlans() }
    else toast.error('Failed to save')
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-zinc-500 text-sm mt-1">{filtered.length} plans in {activeCategory}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-colors">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat.label
                ? `${cat.color} text-white shadow-lg`
                : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
          >
            {cat.icon}
            {cat.label}
            {activeCategory === cat.label && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">
                {cat.label === 'All' ? plans.length : plans.filter(p => p.category === cat.label).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products table */}
      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No products in this category.</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">Add First Product</button>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-4 py-3 text-zinc-400 font-medium">Product</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Category</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Variants & Prices</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Status</th>
                <th className="px-4 py-3 text-zinc-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(plan => (
                <tr key={plan.id} className={`hover:bg-white/3 transition-colors ${!plan.active ? 'opacity-50' : ''}`}>
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                        {getPlanLogo(plan.name, plan.image_url)
                          ? <img src={getPlanLogo(plan.name, plan.image_url)!} alt={plan.name} className="w-full h-full object-contain" />
                          : <span className="text-sm font-black text-white">{plan.name[0]}</span>}
                      </div>
                      <div>
                        <p className="font-medium text-white">{plan.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {plan.badge && <span className="text-[10px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">{plan.badge}</span>}
                          {plan.featured && <span className="text-[10px] text-amber-400">★ Featured</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">{plan.category}</span>
                  </td>

                  {/* Variants with inline price edit */}
                  <td className="px-4 py-3">
                    <div className="space-y-1.5">
                      {plan.price_variants.map((v, vi) => (
                        <div key={vi} className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500 w-16 shrink-0">{v.label}</span>
                          {/* Price */}
                          {inlineEdit?.planId === plan.id && inlineEdit.variantIdx === vi && inlineEdit.field === 'price' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">₹</span>
                              <input
                                type="number"
                                value={inlineEdit.value}
                                onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null) }}
                                className="w-16 bg-purple-600/20 border border-purple-500 text-white rounded px-1 py-0.5 text-xs"
                                autoFocus
                              />
                              <button onClick={saveInlineEdit} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setInlineEdit(null)} className="text-zinc-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(plan.id, vi, 'price', v.price)}
                              className="text-white font-semibold hover:text-purple-400 transition-colors cursor-pointer"
                              title="Click to edit price"
                            >
                              {formatPrice(v.price)}
                            </button>
                          )}
                          <span className="text-zinc-600">/</span>
                          {/* Original price */}
                          {inlineEdit?.planId === plan.id && inlineEdit.variantIdx === vi && inlineEdit.field === 'original_price' ? (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-500">₹</span>
                              <input
                                type="number"
                                value={inlineEdit.value}
                                onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                onKeyDown={e => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null) }}
                                className="w-16 bg-red-600/20 border border-red-500 text-white rounded px-1 py-0.5 text-xs"
                                autoFocus
                              />
                              <button onClick={saveInlineEdit} className="text-green-400 hover:text-green-300"><Check className="w-3 h-3" /></button>
                              <button onClick={() => setInlineEdit(null)} className="text-zinc-500 hover:text-red-400"><X className="w-3 h-3" /></button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(plan.id, vi, 'original_price', v.original_price)}
                              className="text-red-400 line-through hover:text-red-300 transition-colors cursor-pointer"
                              title="Click to edit original price"
                            >
                              {formatPrice(v.original_price)}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">Click any price to edit inline</p>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${plan.active ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                    >
                      {plan.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(plan)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deletePlan(plan.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-zinc-950/90">
              <h2 className="font-bold text-white">{editingPlan ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Netflix Premium" className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-dark w-full">
                    {CATEGORIES.filter(c => c.label !== 'All').map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Badge</label>
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} className="input-dark w-full">
                    {['', 'HOT', 'NEW', 'BEST VALUE', 'BEST DEAL'].map(b => <option key={b} value={b}>{b || 'None'}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input-dark w-full resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm text-zinc-300">Featured (shows in hero banner)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm text-zinc-300">Active</span>
                  </label>
                </div>
              </div>

              {/* Price Variants */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Price Variants</p>
                  <button onClick={() => setForm(f => ({ ...f, price_variants: [...f.price_variants, { label: '1 Month', months: 1, price: 0, original_price: 0, quality: '1080p HD', access: '1 Screen' }] }))} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Variant
                  </button>
                </div>
                <div className="space-y-3">
                  {form.price_variants.map((v, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
                      <button onClick={() => setForm(f => ({ ...f, price_variants: f.price_variants.filter((_, idx) => idx !== i) }))} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Label</label>
                          <input value={v.label} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, label: e.target.value } : pv) }))} className="input-dark w-full text-sm py-2" placeholder="1 Month" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Sale Price (₹) *</label>
                          <input type="number" value={v.price} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, price: Number(e.target.value) } : pv) }))} className="input-dark w-full text-sm py-2" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Original Price (₹)</label>
                          <input type="number" value={v.original_price} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, original_price: Number(e.target.value) } : pv) }))} className="input-dark w-full text-sm py-2" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Quality</label>
                          <input value={v.quality} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, quality: e.target.value } : pv) }))} className="input-dark w-full text-sm py-2" placeholder="1080p HD" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Access</label>
                          <input value={v.access} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, access: e.target.value } : pv) }))} className="input-dark w-full text-sm py-2" placeholder="1 Screen" />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block mb-1">Months</label>
                          <input type="number" value={v.months} onChange={e => setForm(f => ({ ...f, price_variants: f.price_variants.map((pv, idx) => idx === i ? { ...pv, months: Number(e.target.value) } : pv) }))} className="input-dark w-full text-sm py-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 border border-white/20 text-zinc-400 hover:text-white rounded-xl transition-colors">Cancel</button>
                <button onClick={savePlan} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                  {saving ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

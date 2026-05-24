'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, Star, Upload, ImageIcon, Timer } from 'lucide-react'
import type { Plan, PlanVariant } from '@/types'
import { formatPrice } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = ['OTT', 'Combos', 'Games', 'VPN', 'Utilities', 'Premium', 'Digital Keys']
const BADGES = ['', 'HOT', 'NEW', 'BEST VALUE', 'BEST DEAL']

const EMPTY_VARIANT: PlanVariant = { label: '1 Month', months: 1, price: 0, original_price: 0, quality: '1080p HD', access: '1 Screen' }
const EMPTY_PLAN = { name: '', category: 'OTT', description: '', badge: '', featured: false, active: true, sort_order: 0, image_url: '', countdown_ends_at: null as string | null, price_variants: [{ ...EMPTY_VARIANT }] }

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [form, setForm] = useState(EMPTY_PLAN)
  const [saving, setSaving] = useState(false)

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Countdown state (h/m/s to add from now when saving)
  const [cdHours, setCdHours] = useState(0)
  const [cdMinutes, setCdMinutes] = useState(0)
  const [cdSeconds, setCdSeconds] = useState(0)

  useEffect(() => { loadPlans() }, [])

  // Clean up object URL on unmount or when preview changes
  useEffect(() => {
    return () => { if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  async function loadPlans() {
    setLoading(true)
    const res = await fetch('/api/admin/plans')
    if (res.ok) { const { plans } = await res.json(); setPlans(plans) }
    setLoading(false)
  }

  function resetImageState() {
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  function resetCountdown() {
    setCdHours(0)
    setCdMinutes(0)
    setCdSeconds(0)
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_PLAN, price_variants: [{ ...EMPTY_VARIANT }] })
    resetImageState()
    resetCountdown()
    setShowForm(true)
  }

  function openEdit(plan: Plan) {
    setEditing(plan)
    setForm({
      name: plan.name, category: plan.category, description: plan.description || '',
      badge: plan.badge || '', featured: plan.featured, active: plan.active,
      sort_order: plan.sort_order, image_url: plan.image_url || '',
      countdown_ends_at: plan.countdown_ends_at ?? null,
      price_variants: plan.price_variants,
    })
    resetImageState()
    resetCountdown()
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    resetImageState()
    resetCountdown()
  }

  function handleFileSelect(file: File) {
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG and PNG files are allowed')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('File too large — max 3 MB')
      return
    }
    if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [])

  function addVariant() {
    setForm((f) => ({ ...f, price_variants: [...f.price_variants, { ...EMPTY_VARIANT }] }))
  }

  function updateVariant(i: number, key: keyof PlanVariant, value: string | number) {
    setForm((f) => ({
      ...f,
      price_variants: f.price_variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v),
    }))
  }

  function removeVariant(i: number) {
    setForm((f) => ({ ...f, price_variants: f.price_variants.filter((_, idx) => idx !== i) }))
  }

  async function savePlan() {
    if (!form.name.trim()) { toast.error('Plan name required'); return }
    if (form.price_variants.length === 0) { toast.error('At least one price variant required'); return }
    setSaving(true)

    let finalImageUrl = form.image_url || null

    // Upload new image if selected
    if (imageFile) {
      const fd = new FormData()
      fd.append('file', imageFile)
      const uploadRes = await fetch('/api/admin/upload-image', { method: 'POST', body: fd })
      if (!uploadRes.ok) {
        const { error } = await uploadRes.json()
        toast.error(error || 'Image upload failed')
        setSaving(false)
        return
      }
      const { url } = await uploadRes.json()
      finalImageUrl = url
    }

    // Compute countdown_ends_at from h/m/s inputs
    const totalSeconds = cdHours * 3600 + cdMinutes * 60 + cdSeconds
    const finalCountdownEndsAt = totalSeconds > 0
      ? new Date(Date.now() + totalSeconds * 1000).toISOString()
      : form.countdown_ends_at  // preserve existing if no new values entered

    const method = editing ? 'PATCH' : 'POST'
    const url = editing ? `/api/admin/plans/${editing.id}` : '/api/admin/plans'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, image_url: finalImageUrl, countdown_ends_at: finalCountdownEndsAt }),
    })
    if (res.ok) {
      toast.success(editing ? 'Plan updated!' : 'Plan created!')
      closeForm()
      await loadPlans()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to save plan')
    }
    setSaving(false)
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return
    const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Plan deleted'); await loadPlans() }
    else toast.error('Failed to delete')
  }

  async function toggleActive(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !plan.active }),
    })
    await loadPlans()
  }

  const displayImage = imagePreview || (form.image_url || null)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Plans</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-48 skeleton rounded-xl" />)
          : plans.map((plan) => (
              <div key={plan.id} className={`glass rounded-xl p-5 ${!plan.active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Plan image thumbnail */}
                    {plan.image_url && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        <img src={plan.image_url} alt={plan.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{plan.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">{plan.category}</span>
                        {plan.badge && <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">{plan.badge}</span>}
                        {plan.featured && <span className="text-xs text-amber-400">★ Featured</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button onClick={() => openEdit(plan)} className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deletePlan(plan.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  {plan.price_variants.slice(0, 3).map((v) => (
                    <div key={v.label} className="flex justify-between text-xs">
                      <span className="text-zinc-500">{v.label} ({v.quality})</span>
                      <span className="text-white font-medium">{formatPrice(v.price)}</span>
                    </div>
                  ))}
                  {plan.price_variants.length > 3 && (
                    <p className="text-xs text-zinc-600">+{plan.price_variants.length - 3} more variants</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {plan.rating.toFixed(1)} ({plan.review_count})
                  </div>
                  <button
                    onClick={() => toggleActive(plan)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      plan.active ? 'text-green-400 bg-green-400/10' : 'text-zinc-500 bg-zinc-800'
                    }`}
                  >
                    {plan.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
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
              className="bg-[#111113] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-[#111113] z-10">
                <h2 className="font-bold text-white">{editing ? 'Edit Plan' : 'Add New Plan'}</h2>
                <button onClick={closeForm} className="text-zinc-500 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Plan Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Netflix Premium" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-dark">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Badge</label>
                    <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className="input-dark">
                      {BADGES.map((b) => <option key={b} value={b}>{b || 'None'}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Description</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-dark resize-none" placeholder="Plan description..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-1.5">Sort Order</label>
                    <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="input-dark" />
                  </div>
                  <div className="flex items-center gap-4 pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                      <span className="text-sm text-zinc-300">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 accent-purple-600" />
                      <span className="text-sm text-zinc-300">Active</span>
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2">Product Image (JPG, PNG — max 3 MB)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                  />

                  {displayImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                      <img
                        src={displayImage}
                        alt="Product preview"
                        className="w-full h-40 object-contain bg-zinc-900"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100 gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => { resetImageState(); setForm((f) => ({ ...f, image_url: '' })) }}
                          className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                      {imageFile && (
                        <div className="absolute bottom-2 left-2 bg-green-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          New image selected
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        dragOver
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/15 hover:border-purple-500/50 hover:bg-white/5'
                      }`}
                    >
                      <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-sm text-zinc-400 font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-zinc-600 mt-1">JPG, JPEG, PNG — max 3 MB</p>
                    </div>
                  )}
                </div>

                {/* Countdown Timer */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="w-4 h-4 text-orange-400" />
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Countdown Timer</label>
                  </div>

                  {/* Show active countdown if one exists */}
                  {form.countdown_ends_at && new Date(form.countdown_ends_at) > new Date() && (
                    <div className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2.5 mb-3">
                      <div>
                        <p className="text-xs text-orange-400 font-medium">Active countdown</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Ends: {new Date(form.countdown_ends_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, countdown_ends_at: null }))}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] text-zinc-500 mb-2">Set a new countdown from now:</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Hours</label>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={cdHours}
                        onChange={(e) => setCdHours(Math.max(0, Number(e.target.value)))}
                        className="input-dark text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Minutes</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={cdMinutes}
                        onChange={(e) => setCdMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                        className="input-dark text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Seconds</label>
                      <input
                        type="number"
                        min={0}
                        max={59}
                        value={cdSeconds}
                        onChange={(e) => setCdSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                        className="input-dark text-sm py-2"
                      />
                    </div>
                  </div>
                  {(cdHours + cdMinutes + cdSeconds) > 0 && (
                    <p className="text-[11px] text-orange-400 mt-2">
                      Will set countdown for {cdHours}h {cdMinutes}m {cdSeconds}s from save time
                    </p>
                  )}
                </div>

                {/* Price Variants */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Price Variants *</label>
                    <button onClick={addVariant} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                      <Plus className="w-3.5 h-3.5" />
                      Add Variant
                    </button>
                  </div>
                  <div className="space-y-3">
                    {form.price_variants.map((v, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 relative">
                        <button onClick={() => removeVariant(i)} className="absolute top-3 right-3 text-zinc-600 hover:text-red-400 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Label</label>
                            <input value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)} placeholder="1 Month" className="input-dark text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Price (₹) *</label>
                            <input type="number" value={v.price} onChange={(e) => updateVariant(i, 'price', Number(e.target.value))} className="input-dark text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Original Price (₹)</label>
                            <input type="number" value={v.original_price} onChange={(e) => updateVariant(i, 'original_price', Number(e.target.value))} className="input-dark text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Quality</label>
                            <input value={v.quality} onChange={(e) => updateVariant(i, 'quality', e.target.value)} placeholder="1080p HD" className="input-dark text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Access</label>
                            <input value={v.access} onChange={(e) => updateVariant(i, 'access', e.target.value)} placeholder="1 Screen" className="input-dark text-sm py-2" />
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 block mb-1">Months</label>
                            <input type="number" value={v.months} onChange={(e) => updateVariant(i, 'months', Number(e.target.value))} className="input-dark text-sm py-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={closeForm} className="flex-1 py-3 border border-white/20 text-zinc-400 hover:text-white rounded-xl transition-all">
                    Cancel
                  </button>
                  <button onClick={savePlan} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {imageFile ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (editing ? 'Update Plan' : 'Create Plan')}
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

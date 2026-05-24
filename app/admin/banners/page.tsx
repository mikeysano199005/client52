'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Banner } from '@/types'

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link: '',
    button_text: 'Shop Now',
    sort_order: 0,
    active: true,
  })

  useEffect(() => { fetchBanners() }, [])

  async function fetchBanners() {
    setLoading(true)
    const res = await fetch('/api/admin/banners')
    const data = await res.json()
    setBanners(data || [])
    setLoading(false)
  }

  function openCreate() {
    setEditing(null)
    setForm({ title: '', subtitle: '', image_url: '', link: '', button_text: 'Shop Now', sort_order: banners.length, active: true })
    setShowModal(true)
  }

  function openEdit(b: Banner) {
    setEditing(b)
    setForm({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      link: b.link || '',
      button_text: b.button_text,
      sort_order: b.sort_order,
      active: b.active,
    })
    setShowModal(true)
  }

  async function handleSave() {
    const method = editing ? 'PATCH' : 'POST'
    const url = editing ? `/api/admin/banners/${editing.id}` : '/api/admin/banners'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) {
      toast.success(editing ? 'Banner updated' : 'Banner created')
      setShowModal(false)
      fetchBanners()
    } else {
      toast.error('Failed to save banner')
    }
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !b.active }),
    })
    fetchBanners()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    toast.success('Banner deleted')
    fetchBanners()
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Banners</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage homepage hero banners</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      ) : banners.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Image className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No banners yet. Create your first banner.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="w-24 h-16 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{b.title || 'Untitled Banner'}</p>
                <p className="text-sm text-zinc-500 truncate">{b.subtitle}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-zinc-600">Order: {b.sort_order}</span>
                  {b.link && <span className="text-xs text-purple-400 truncate max-w-[200px]">{b.link}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-1 rounded text-xs font-medium ${b.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {b.active ? 'Active' : 'Hidden'}
                </span>
                <button onClick={() => toggleActive(b)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                  {b.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(b)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(b.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-5">{editing ? 'Edit Banner' : 'New Banner'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Premium Netflix Plans" className="input-dark w-full" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Subtitle</label>
                <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Starting at ₹99/month" className="input-dark w-full" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Image URL</label>
                <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." className="input-dark w-full" />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Link (optional)</label>
                <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="/category/ott" className="input-dark w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Button Text</label>
                  <input value={form.button_text} onChange={e => setForm(f => ({ ...f, button_text: e.target.value }))} className="input-dark w-full" />
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="input-dark w-full" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full transition-colors ${form.active ? 'bg-purple-600' : 'bg-zinc-700'}`} onClick={() => setForm(f => ({ ...f, active: !f.active }))}>
                  <div className={`w-4 h-4 bg-white rounded-full m-1 transition-transform ${form.active ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm text-zinc-300">Active</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                {editing ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

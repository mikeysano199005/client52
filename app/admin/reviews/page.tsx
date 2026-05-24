'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2, Eye, EyeOff, CheckCircle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Review } from '@/types'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [replyModal, setReplyModal] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => { fetchReviews() }, [])

  async function fetchReviews() {
    setLoading(true)
    const res = await fetch('/api/admin/reviews')
    const data = await res.json()
    setReviews(data || [])
    setLoading(false)
  }

  async function toggleActive(r: Review) {
    await fetch(`/api/admin/reviews/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !r.active }),
    })
    fetchReviews()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review?')) return
    await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' })
    toast.success('Review deleted')
    fetchReviews()
  }

  async function handleReply() {
    if (!replyModal) return
    const res = await fetch(`/api/admin/reviews/${replyModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_reply: replyText }),
    })
    if (res.ok) {
      toast.success('Reply saved')
      setReplyModal(null)
      fetchReviews()
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reviews</h1>
        <p className="text-zinc-500 text-sm mt-1">{reviews.length} total reviews</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-zinc-800 rounded-xl animate-pulse" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Star className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className={`glass rounded-xl p-4 ${!r.active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-white">{r.name}</span>
                    {r.verified && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-zinc-300 mb-2">{r.body}</p>
                  {r.admin_reply && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 mt-2">
                      <p className="text-xs text-purple-400 font-medium mb-1">Admin Reply</p>
                      <p className="text-sm text-zinc-300">{r.admin_reply}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${r.active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                    {r.active ? 'Visible' : 'Hidden'}
                  </span>
                  <button onClick={() => { setReplyModal(r); setReplyText(r.admin_reply || '') }} className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Reply">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(r)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors">
                    {r.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {replyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-2">Reply to Review</h2>
            <p className="text-sm text-zinc-400 mb-4">&quot;{replyModal.body}&quot;</p>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={4}
              placeholder="Write your reply..."
              className="input-dark w-full resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReplyModal(null)} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleReply} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">Save Reply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

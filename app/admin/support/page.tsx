'use client'

import { useState, useEffect } from 'react'
import { Headphones, MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  user_id: string
  subject: string
  message: string
  status: 'open' | 'replied' | 'closed'
  admin_reply?: string
  created_at: string
  user?: { name: string; email: string }
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'replied' | 'closed'>('all')

  useEffect(() => { fetchTickets() }, [])

  async function fetchTickets() {
    const res = await fetch('/api/admin/support')
    const data = await res.json()
    setTickets(data || [])
    setLoading(false)
  }

  async function handleReply(status: 'replied' | 'closed') {
    if (!selected) return
    const res = await fetch(`/api/admin/support/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_reply: reply, status }),
    })
    if (res.ok) {
      toast.success(status === 'closed' ? 'Ticket closed' : 'Reply sent')
      setSelected(null)
      setReply('')
      fetchTickets()
    }
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  const statusConfig = {
    open: { color: 'text-yellow-400 bg-yellow-500/20', icon: <Clock className="w-3 h-3" /> },
    replied: { color: 'text-blue-400 bg-blue-500/20', icon: <MessageSquare className="w-3 h-3" /> },
    closed: { color: 'text-green-400 bg-green-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="text-zinc-500 text-sm mt-1">{tickets.filter(t => t.status === 'open').length} open tickets</p>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'open', 'replied', 'closed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {f} {f !== 'all' && `(${tickets.filter(t => t.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-zinc-800 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Headphones className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500">No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => (
            <div key={t.id} className="glass rounded-xl p-4 hover:border-purple-500/30 border border-transparent transition-colors cursor-pointer" onClick={() => { setSelected(t); setReply(t.admin_reply || '') }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white truncate">{t.subject}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[t.status].color}`}>
                      {statusConfig[t.status].icon} {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{t.message}</p>
                  <p className="text-xs text-zinc-600 mt-1">{t.user?.name} · {t.user?.email} · {new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <AlertCircle className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold text-white mb-1">{selected.subject}</h2>
            <p className="text-xs text-zinc-500 mb-4">{selected.user?.name} ({selected.user?.email})</p>
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
              <p className="text-sm text-zinc-300">{selected.message}</p>
            </div>
            {selected.admin_reply && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-purple-400 font-medium mb-1">Previous Reply</p>
                <p className="text-sm text-zinc-300">{selected.admin_reply}</p>
              </div>
            )}
            <textarea value={reply} onChange={e => setReply(e.target.value)} rows={4} placeholder="Write your reply..." className="input-dark w-full resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setSelected(null)} className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={() => handleReply('closed')} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors">Close</button>
              <button onClick={() => handleReply('replied')} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Send className="w-4 h-4" /> Send Reply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

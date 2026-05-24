'use client'
import { useState, useEffect, useCallback } from 'react'
import { Headphones, MessageCircle, Loader2, ChevronLeft, CheckCircle } from 'lucide-react'
import SupportChat from '@/components/support/SupportChat'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'replied' | 'closed'
  updated_at: string
  user?: { id: string; name: string; email: string }
  support_messages: Array<{ sender_type: string; message: string; is_read: boolean; created_at: string }>
}

const STATUS: Record<string, { label: string; dot: string; text: string }> = {
  open:    { label: 'Open',    dot: 'bg-yellow-400', text: 'text-yellow-400' },
  replied: { label: 'Replied', dot: 'bg-blue-400',   text: 'text-blue-400' },
  closed:  { label: 'Closed',  dot: 'bg-zinc-500',   text: 'text-zinc-500' },
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Ticket | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'replied' | 'closed'>('all')
  const [closing, setClosing] = useState(false)

  const fetchTickets = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/admin/support')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch { setTickets([]) }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Poll for new tickets every 10s
  useEffect(() => {
    const t = setInterval(() => fetchTickets(true), 10000)
    return () => clearInterval(t)
  }, [fetchTickets])

  async function closeTicket() {
    if (!active) return
    setClosing(true)
    try {
      await fetch(`/api/admin/support/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' }),
      })
      setTickets(prev => prev.map(t => t.id === active.id ? { ...t, status: 'closed' } : t))
      setActive(t => t ? { ...t, status: 'closed' } : t)
      toast.success('Ticket closed')
    } finally { setClosing(false) }
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const totalUnread = tickets.reduce((n, t) =>
    n + t.support_messages.filter(m => m.sender_type === 'user' && !m.is_read).length, 0)

  function lastMessage(t: Ticket) {
    return [...t.support_messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="flex h-screen">
      {/* Left — Ticket list */}
      <div className={`flex flex-col border-r border-white/10 bg-zinc-950 ${active ? 'hidden lg:flex lg:w-80 shrink-0' : 'w-full lg:w-80 lg:shrink-0'}`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-purple-400" />
              Support
              {totalUnread > 0 && (
                <span className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </h1>
          </div>
          <div className="flex gap-1">
            {(['all', 'open', 'replied', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center p-6">
              <MessageCircle className="w-10 h-10 text-zinc-700" />
              <p className="text-zinc-500 text-sm">No tickets yet</p>
            </div>
          ) : (
            filtered.map(t => {
              const last = lastMessage(t)
              const unread = t.support_messages.filter(m => m.sender_type === 'user' && !m.is_read).length
              const st = STATUS[t.status]
              const isActive = active?.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(t)}
                  className={`w-full px-4 py-3.5 flex items-start gap-3 text-left border-b border-white/5 transition-colors ${isActive ? 'bg-purple-600/10 border-l-2 border-l-purple-500' : 'hover:bg-white/5'}`}
                >
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-purple-400 text-sm font-bold">
                      {t.user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${st.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        {unread > 0 && (
                          <span className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {t.user?.name} · {last ? last.message : 'No messages'}
                    </p>
                    <p className="text-[10px] text-zinc-700 mt-0.5">{timeAgo(t.updated_at)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right — Chat */}
      {active ? (
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Chat header */}
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-3 shrink-0 bg-zinc-950">
            <button onClick={() => setActive(null)} className="lg:hidden text-zinc-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-purple-400 text-sm font-bold shrink-0">
              {active.user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{active.subject}</p>
              <p className="text-xs text-zinc-500 truncate">{active.user?.name} · {active.user?.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs font-medium ${STATUS[active.status].text} capitalize`}>
                ● {active.status}
              </span>
              {active.status !== 'closed' && (
                <button
                  onClick={closeTicket}
                  disabled={closing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-400 hover:text-white rounded-lg text-xs transition-all disabled:opacity-50"
                >
                  {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Chat body */}
          <div className="flex-1 min-h-0 bg-[#09090b]">
            <SupportChat
              ticketId={active.id}
              isAdmin
              status={active.status}
              onStatusChange={(s) => {
                setActive(t => t ? { ...t, status: s as Ticket['status'] } : t)
                setTickets(prev => prev.map(t => t.id === active.id ? { ...t, status: s as Ticket['status'] } : t))
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden lg:flex flex-col items-center justify-center gap-3 text-center p-8 bg-[#09090b]">
          <MessageCircle className="w-14 h-14 text-zinc-800" />
          <p className="text-zinc-600">Select a conversation to view</p>
        </div>
      )}
    </div>
  )
}

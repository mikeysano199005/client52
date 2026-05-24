'use client'
import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, ChevronLeft, Plus, Loader2 } from 'lucide-react'
import SupportChat from './SupportChat'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'replied' | 'closed'
  updated_at: string
  support_messages: Array<{ sender_type: string; message: string; is_read: boolean; created_at: string }>
}

interface Props {
  defaultSubject?: string   // Pre-fill subject (e.g. "Order #12345 Issue")
}

const STATUS_DOT: Record<string, string> = {
  open: 'bg-yellow-400',
  replied: 'bg-blue-400',
  closed: 'bg-zinc-500',
}

export default function SupportWidget({ defaultSubject }: Props) {
  const [open, setOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState(defaultSubject || '')
  const [firstMsg, setFirstMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (open && !hasFetched.current) {
      hasFetched.current = true
      fetchTickets()
    }
  }, [open])

  async function fetchTickets() {
    setLoading(true)
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  async function startConversation() {
    const sub = subject.trim() || 'Support Request'
    const msg = firstMsg.trim()
    if (!msg) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: sub, message: msg }),
      })
      if (res.ok) {
        const { ticket } = await res.json()
        const freshTicket: Ticket = { ...ticket, support_messages: [] }
        setTickets(prev => [freshTicket, ...prev])
        setActiveTicket(freshTicket)
        setShowForm(false)
        setFirstMsg('')
        setSubject(defaultSubject || '')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Unread count: admin messages the user hasn't read
  const unread = tickets.reduce((n, t) =>
    n + t.support_messages.filter(m => m.sender_type === 'admin' && !m.is_read).length, 0)

  function lastMessage(t: Ticket) {
    const msgs = [...t.support_messages].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return msgs[0]
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-white/15 hover:border-purple-500/50 rounded-full shadow-lg text-sm text-zinc-300 hover:text-white transition-all"
      >
        {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4 text-purple-400" />}
        {!open && 'Need Help?'}
        {!open && unread > 0 && (
          <span className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 left-6 z-40 w-[340px] sm:w-[380px] h-[520px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 bg-zinc-900 shrink-0">
            {activeTicket ? (
              <>
                <button onClick={() => setActiveTicket(null)} className="text-zinc-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{activeTicket.subject}</p>
                  <p className="text-xs text-zinc-500 capitalize">{activeTicket.status}</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Support</p>
                  <p className="text-xs text-zinc-500">We reply within a few hours</p>
                </div>
                <button
                  onClick={() => setShowForm(f => !f)}
                  className="w-7 h-7 rounded-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 flex items-center justify-center transition-all"
                  title="New conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Body */}
          {activeTicket ? (
            <SupportChat
              ticketId={activeTicket.id}
              status={activeTicket.status}
              onStatusChange={(s) => setActiveTicket(t => t ? { ...t, status: s as Ticket['status'] } : t)}
              pollInterval={5000}
            />
          ) : showForm ? (
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              <p className="text-xs text-zinc-500">Tell us what's going on and we'll help you out.</p>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Subject</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. My order wasn't delivered"
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Message</label>
                <textarea
                  value={firstMsg}
                  onChange={e => setFirstMsg(e.target.value)}
                  placeholder="Describe your issue…"
                  rows={5}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
              <button
                onClick={startConversation}
                disabled={!firstMsg.trim() || submitting}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                  <MessageCircle className="w-10 h-10 text-zinc-700" />
                  <p className="text-zinc-500 text-sm">No conversations yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
                  >
                    Start a Chat
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {tickets.map(t => {
                    const last = lastMessage(t)
                    const unreadCount = t.support_messages.filter(m => m.sender_type === 'admin' && !m.is_read).length
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTicket(t)}
                        className="w-full px-4 py-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-purple-400">
                            <MessageCircle className="w-4 h-4" />
                          </div>
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${STATUS_DOT[t.status]}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                            {unreadCount > 0 && (
                              <span className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          {last && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">
                              {last.sender_type === 'admin' ? '💬 Support: ' : 'You: '}{last.message}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}

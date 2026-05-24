'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Headphones, ChevronLeft, Plus, MessageCircle, Loader2, X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SupportChat from '@/components/support/SupportChat'

interface Ticket {
  id: string
  subject: string
  status: 'open' | 'replied' | 'closed'
  updated_at: string
  support_messages: Array<{ sender_type: string; message: string; is_read: boolean; created_at: string }>
}
interface UserData { name: string; role: string; wallet_balance: number }

const STATUS: Record<string, { label: string; dot: string }> = {
  open:    { label: 'Open',    dot: 'bg-yellow-400' },
  replied: { label: 'Replied', dot: 'bg-blue-400' },
  closed:  { label: 'Closed',  dot: 'bg-zinc-500' },
}

export default function SupportPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState<Ticket | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [firstMsg, setFirstMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const { user: u } = await res.json()
      if (!u) { router.push('/login'); return }
      setUser(u)
      if (!hasFetched.current) { hasFetched.current = true; fetchTickets() }
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function fetchTickets() {
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch { setTickets([]) }
    finally { setLoading(false) }
  }

  async function startConversation() {
    if (!subject.trim() || !firstMsg.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: firstMsg.trim() }),
      })
      if (res.ok) {
        const { ticket } = await res.json()
        const t: Ticket = { ...ticket, support_messages: [] }
        setTickets(prev => [t, ...prev])
        setActive(t)
        setShowForm(false)
        setSubject(''); setFirstMsg('')
      }
    } finally { setSubmitting(false) }
  }

  function lastMessage(t: Ticket) {
    return [...t.support_messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 pt-24 pb-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-5 h-5 text-purple-400" />
              Support
            </h1>
          </div>
          <button
            onClick={() => { setShowForm(true); setActive(null) }}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Split layout */}
        <div className="flex-1 flex gap-4 min-h-0" style={{ height: 'calc(100vh - 220px)' }}>

          {/* Left — Conversation list */}
          <div className={`flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden ${active || showForm ? 'hidden md:flex md:w-72 shrink-0' : 'w-full md:w-72 md:shrink-0'}`}>
            <div className="px-4 py-3 border-b border-white/10 shrink-0">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <MessageCircle className="w-10 h-10 text-zinc-700" />
                  <p className="text-zinc-500 text-sm">No conversations yet</p>
                  <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm transition-all">
                    Start Chat
                  </button>
                </div>
              ) : (
                tickets.map(t => {
                  const last = lastMessage(t)
                  const unread = t.support_messages.filter(m => m.sender_type === 'admin' && !m.is_read).length
                  const st = STATUS[t.status]
                  const isActive = active?.id === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setActive(t); setShowForm(false) }}
                      className={`w-full px-4 py-3.5 flex items-start gap-3 text-left border-b border-white/5 transition-colors ${isActive ? 'bg-purple-600/10 border-l-2 border-l-purple-500' : 'hover:bg-white/5'}`}
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-purple-400">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-900 ${st.dot}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                          {unread > 0 && (
                            <span className="w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        {last ? (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {last.sender_type === 'admin' ? '💬 ' : 'You: '}{last.message}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-600 mt-0.5">No messages</p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right — Chat / Form */}
          <div className={`flex-1 flex flex-col bg-zinc-900/60 border border-white/10 rounded-2xl overflow-hidden ${!active && !showForm ? 'hidden md:flex' : 'flex'}`}>
            {showForm ? (
              <>
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                  <p className="text-sm font-semibold text-white">New Conversation</p>
                  <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                  <p className="text-sm text-zinc-400">Tell us what's going on and our team will get back to you.</p>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Subject</label>
                    <input
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. My order wasn't delivered"
                      className="input-dark"
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1.5 block">Message</label>
                    <textarea
                      value={firstMsg}
                      onChange={e => setFirstMsg(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      className="input-dark resize-none"
                      maxLength={2000}
                    />
                  </div>
                  <button
                    onClick={startConversation}
                    disabled={!subject.trim() || !firstMsg.trim() || submitting}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Message'}
                  </button>
                </div>
              </>
            ) : active ? (
              <>
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3 shrink-0">
                  <button onClick={() => setActive(null)} className="md:hidden text-zinc-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{active.subject}</p>
                    <p className="text-xs text-zinc-500 capitalize">{STATUS[active.status].label}</p>
                  </div>
                </div>
                <SupportChat
                  ticketId={active.id}
                  status={active.status}
                  onStatusChange={(s) => setActive(t => t ? { ...t, status: s as Ticket['status'] } : t)}
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <MessageCircle className="w-12 h-12 text-zinc-700" />
                <p className="text-zinc-500">Select a conversation or start a new chat</p>
                <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all">
                  New Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

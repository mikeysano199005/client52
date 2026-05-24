'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Headphones, ChevronLeft, Send, MessageSquare, Clock, CheckCircle, Plus, X } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import toast from 'react-hot-toast'

interface Ticket {
  id: string
  subject: string
  message: string
  status: 'open' | 'replied' | 'closed'
  admin_reply?: string
  created_at: string
}

interface UserData { name: string; role: string; wallet_balance: number }

const STATUS_CONFIG = {
  open:    { label: 'Open',    color: 'text-yellow-400 bg-yellow-500/20', icon: <Clock className="w-3 h-3" /> },
  replied: { label: 'Replied', color: 'text-blue-400 bg-blue-500/20',    icon: <MessageSquare className="w-3 h-3" /> },
  closed:  { label: 'Closed',  color: 'text-green-400 bg-green-500/20',  icon: <CheckCircle className="w-3 h-3" /> },
}

export default function SupportPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/auth/me')
      if (!res.ok) { router.push('/login'); return }
      const { user: u } = await res.json()
      if (!u) { router.push('/login'); return }
      setUser(u)
      fetchTickets()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  async function fetchTickets() {
    try {
      const res = await fetch('/api/support')
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      })
      if (res.ok) {
        toast.success('Ticket submitted! We\'ll get back to you soon.')
        setSubject('')
        setMessage('')
        setShowForm(false)
        fetchTickets()
      } else {
        toast.error('Failed to submit ticket')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Headphones className="w-6 h-6 text-purple-400" />
              Support
            </h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        {/* Info card */}
        <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3 border border-purple-500/20">
          <MessageSquare className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-zinc-300 font-medium">Need help? We typically reply within 24 hours.</p>
            <p className="text-xs text-zinc-500 mt-0.5">You can also reach us directly on WhatsApp or Telegram for faster support.</p>
          </div>
        </div>

        {/* New Ticket Form */}
        {showForm && (
          <div className="glass rounded-xl p-5 mb-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">New Support Ticket</h2>
              <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
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
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail. Include your order number if relevant."
                  rows={5}
                  className="input-dark resize-none"
                  maxLength={2000}
                />
                <p className="text-xs text-zinc-600 mt-1 text-right">{message.length}/2000</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-white/20 text-zinc-400 hover:text-white rounded-xl text-sm transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : <><Send className="w-4 h-4" /> Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tickets list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Headphones className="w-14 h-14 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No tickets yet</h2>
            <p className="text-zinc-500 text-sm mb-5">Have an issue? Our team is here to help.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const cfg = STATUS_CONFIG[t.status]
              const isOpen = expanded === t.id
              return (
                <div
                  key={t.id}
                  className="glass rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="w-full px-5 py-4 flex items-start justify-between gap-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{t.subject}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <ChevronLeft className={`w-4 h-4 text-zinc-500 shrink-0 mt-0.5 transition-transform ${isOpen ? '-rotate-90' : 'rotate-180'}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-white/10">
                      <div className="mt-4 bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 mb-1 font-medium uppercase tracking-wide">Your message</p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{t.message}</p>
                      </div>
                      {t.admin_reply && (
                        <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                          <p className="text-xs text-purple-400 mb-1 font-medium uppercase tracking-wide">Support reply</p>
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{t.admin_reply}</p>
                        </div>
                      )}
                      {!t.admin_reply && (
                        <p className="text-xs text-zinc-600 mt-3 text-center">Awaiting reply from our team…</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

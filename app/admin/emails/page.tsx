'use client'

import { useState, useEffect } from 'react'
import { Mail, Send, Clock, CheckCircle, XCircle, Users, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

type Template = 'renewal_reminder' | 'new_offer' | 'thank_you' | 'custom'

interface EmailLog {
  id: string
  template: string
  recipients: number
  sent: number
  failed: number
  custom_subject?: string
  sent_at: string
}

const TEMPLATE_META: Record<Template, { label: string; description: string; emoji: string }> = {
  renewal_reminder: {
    label: 'Renewal Reminder',
    emoji: '⏰',
    description: "Reminds users their subscription is expiring and prompts them to renew.",
  },
  new_offer: {
    label: 'New Offer',
    emoji: '🔥',
    description: "Promote a special deal or discount to all active buyers.",
  },
  thank_you: {
    label: 'Thank You',
    emoji: '💜',
    description: "Send appreciation to loyal customers and encourage referrals.",
  },
  custom: {
    label: 'Custom Message',
    emoji: '✏️',
    description: "Write your own subject and body. Use {name}, {plan}, {variant}, {price}, {order_number}.",
  },
}

const TEMPLATE_PREVIEW: Record<Template, (n: string, p: string, v: string, price: string, ord: string) => string> = {
  renewal_reminder: (n, p, v, price, ord) =>
    `Hi ${n},\n\nYour ${p} ${v} subscription is expiring soon!\nRenewal price: ₹${price}\n\nContact us to renew now.\n\nOrder #${ord}`,
  new_offer: (n, p, v, price, ord) =>
    `Hi ${n},\n\n🔥 Special offer just for you!\n\nBased on your ${p} ${v} subscription, we have something amazing lined up.\n\nContact us to claim your offer.\n\nOrder #${ord}`,
  thank_you: (n, p, v, price, ord) =>
    `Hi ${n},\n\n💜 Thank you for choosing DIGITAL OTT!\n\nYou've been enjoying: ${p} — ${v}\n\nShare with friends and earn ₹20 wallet credit per referral!\n\nOrder #${ord}`,
  custom: () => 'Write your custom message in the editor below.',
}

export default function AdminEmailsPage() {
  const [template, setTemplate] = useState<Template>('renewal_reminder')
  const [customSubject, setCustomSubject] = useState('')
  const [customHtml, setCustomHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLogsLoading(true)
    const res = await fetch('/api/admin/emails/logs')
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLogsLoading(false)
  }

  async function handleSend() {
    if (template === 'custom' && (!customSubject.trim() || !customHtml.trim())) {
      toast.error('Subject and body are required for custom emails')
      return
    }
    setSending(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/admin/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, customSubject, customHtml }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send emails')
      } else {
        toast.success(`✅ Sent ${data.sent} emails (${data.failed} failed) out of ${data.total} recipients`)
        fetchLogs()
      }
    } finally {
      setSending(false)
    }
  }

  const previewText = TEMPLATE_PREVIEW[template](
    'Rahul Sharma', 'Netflix', '1 Month Premium', '199', 'ORD-1234'
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <Mail className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Email Broadcasts</h1>
          <p className="text-sm text-zinc-500">Send personalized emails to all active buyers</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="glass rounded-2xl border border-white/10 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-white">Compose Broadcast</h2>

          {/* Template picker */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-400">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TEMPLATE_META) as Template[]).map((t) => {
                const meta = TEMPLATE_META[t]
                return (
                  <button
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      template === t
                        ? 'bg-purple-600/20 border-purple-500/40 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-lg mb-1">{meta.emoji}</div>
                    <div className="text-xs font-semibold">{meta.label}</div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-zinc-500">{TEMPLATE_META[template].description}</p>
          </div>

          {/* Custom fields */}
          {template === 'custom' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">Subject Line</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. Special offer for {name}!"
                  className="input-dark"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Email Body (plain text, use {'{'}name{'}'}, {'{'}plan{'}'}, {'{'}variant{'}'}, {'{'}price{'}'}, {'{'}order_number{'}'})
                </label>
                <textarea
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  rows={8}
                  placeholder="Hi {name},&#10;&#10;We have something special for you...&#10;&#10;Your plan: {plan} — {variant}"
                  className="input-dark resize-none font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Send button */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={sending}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to All Active Buyers
            </button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <p className="text-sm text-amber-300 font-medium">⚠️ This will send emails to ALL active buyers. Are you sure?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {sending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send className="w-3.5 h-3.5" /> Yes, Send Now</>
                  }
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={sending}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="glass rounded-2xl border border-white/10 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white">Preview</h2>
          <div className="bg-[#09090b] rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center text-xs font-bold text-purple-400">DO</div>
              <div>
                <p className="text-xs font-medium text-white">DIGITAL OTT</p>
                <p className="text-[10px] text-zinc-500">noreply@digitalott.in</p>
              </div>
            </div>
            <p className="text-xs font-semibold text-zinc-300 mb-3">
              {template === 'custom'
                ? (customSubject || 'Your subject line will appear here')
                : TEMPLATE_META[template].label
              }
            </p>
            <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans leading-relaxed">
              {template === 'custom' ? (customHtml || 'Your email body will appear here') : previewText}
            </pre>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
            <Users className="w-4 h-4 text-zinc-500 shrink-0" />
            <p className="text-xs text-zinc-400">
              Emails are personalized with each user's name, their most recent delivered order's plan, variant, price, and order number.
            </p>
          </div>
        </div>
      </div>

      {/* Sent logs */}
      <div className="glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" />
            Broadcast History
          </h2>
          <button onClick={fetchLogs} className="text-xs text-zinc-500 hover:text-white transition-colors">
            Refresh
          </button>
        </div>

        {logsLoading ? (
          <div className="p-8 text-center text-zinc-500 text-sm">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">No broadcasts sent yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white capitalize">
                    {log.custom_subject || TEMPLATE_META[log.template as Template]?.label || log.template}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(log.sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Users className="w-3.5 h-3.5" />
                    {log.recipients} total
                  </span>
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {log.sent} sent
                  </span>
                  {log.failed > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="w-3.5 h-3.5" />
                      {log.failed} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

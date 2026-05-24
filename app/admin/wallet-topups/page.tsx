'use client'
import { useState, useEffect } from 'react'
import { Wallet, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { WalletTopup } from '@/types'

type Filter = 'pending' | 'approved' | 'rejected' | 'all'

const FILTER_TABS: { label: string; value: Filter }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
]

export default function AdminWalletTopupsPage() {
  const [topups, setTopups] = useState<WalletTopup[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})

  async function load(f: Filter = filter) {
    setLoading(true)
    const res = await fetch(`/api/admin/wallet-topups?status=${f}`)
    if (res.ok) {
      const { topups: data } = await res.json()
      setTopups(data)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionId(id)
    const res = await fetch(`/api/admin/wallet-topups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, admin_notes: rejectNotes[id] || null }),
    })
    if (res.ok) {
      toast.success(action === 'approve' ? 'Wallet credited!' : 'Request rejected')
      load()
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed')
    }
    setActionId(null)
  }

  const STATUS_BADGE: Record<string, string> = {
    pending: 'text-amber-400 bg-amber-400/10',
    approved: 'text-green-400 bg-green-400/10',
    rejected: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-6 h-6 text-purple-400" />
          Wallet Top-Ups
        </h1>
        <button onClick={() => load()} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === tab.value
                ? 'bg-purple-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
      ) : topups.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Clock className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500">No {filter !== 'all' ? filter : ''} top-up requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topups.map((t) => {
            const u = t.user as { name: string; email: string; wallet_balance: number } | undefined
            const isPending = t.status === 'pending'
            return (
              <div key={t.id} className="glass rounded-xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* User + amount info */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{u?.name || 'Unknown'}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status]}`}>
                          {t.status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                          {t.status === 'approved' && <CheckCircle className="w-2.5 h-2.5" />}
                          {t.status === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                          {t.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">{u?.email}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Current balance: <span className="text-zinc-400">{formatPrice(u?.wallet_balance || 0)}</span>
                      </p>
                      <p className="text-xs text-zinc-600 mt-1">
                        UTR: <span className="font-mono text-zinc-300">{t.payment_utr || '—'}</span>
                        {'  '}·{'  '}{formatDateTime(t.created_at)}
                      </p>
                      {t.admin_notes && (
                        <p className="text-xs text-zinc-500 italic mt-1">Note: {t.admin_notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Amount + actions */}
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <p className="text-2xl font-bold text-white">{formatPrice(t.amount)}</p>
                    {t.payment_proof_url && (
                      <a
                        href={t.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> View Screenshot
                      </a>
                    )}
                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(t.id, 'reject')}
                          disabled={actionId === t.id}
                          className="px-3 py-1.5 text-xs font-semibold text-red-400 border border-red-400/30 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleAction(t.id, 'approve')}
                          disabled={actionId === t.id}
                          className="px-3 py-1.5 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {actionId === t.id
                            ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckCircle className="w-3 h-3" />}
                          Approve & Credit
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reject note input for pending */}
                {isPending && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <input
                      value={rejectNotes[t.id] || ''}
                      onChange={(e) => setRejectNotes(n => ({ ...n, [t.id]: e.target.value }))}
                      placeholder="Rejection reason (optional, shown to user)"
                      className="input-dark text-sm py-2"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

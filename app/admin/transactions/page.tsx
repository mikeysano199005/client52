'use client'

import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface TxRow {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  amount: number
  reason: string
  created_at: string
  user?: { name: string; email: string }
}

export default function AdminTransactionsPage() {
  const [txns, setTxns] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all')

  useEffect(() => {
    fetch('/api/admin/transactions').then(r => r.json()).then(d => { setTxns(d || []); setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? txns : txns.filter(t => t.type === filter)
  const totalCredits = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebits = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Wallet Transactions</h1>
        <p className="text-zinc-500 text-sm mt-1">{txns.length} total transactions</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{txns.length}</p>
          <p className="text-xs text-zinc-500 mt-1">All Transactions</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{formatPrice(totalCredits)}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Credited</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{formatPrice(totalDebits)}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Debited</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'credit', 'debit'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${filter === f ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-zinc-400 font-medium">Type</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">User</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Reason</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Amount</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500">No transactions found.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${t.type === 'credit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {t.type === 'credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{t.user?.name || '—'}</p>
                  <p className="text-xs text-zinc-500">{t.user?.email}</p>
                </td>
                <td className="px-4 py-3 text-zinc-300">{t.reason}</td>
                <td className={`px-4 py-3 font-semibold ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {t.type === 'credit' ? '+' : '-'}{formatPrice(t.amount)}
                </td>
                <td className="px-4 py-3 text-zinc-400">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { UserCheck, CheckCircle, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface ReferralRow {
  id: string
  referrer_id: string
  referred_id: string
  reward_amount: number
  status: 'pending' | 'credited'
  order_id?: string
  created_at: string
  referrer?: { name: string; email: string }
  referred?: { name: string; email: string }
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/referrals').then(r => r.json()).then(d => { setReferrals(d || []); setLoading(false) })
  }, [])

  const totalPaid = referrals.filter(r => r.status === 'credited').reduce((s, r) => s + r.reward_amount, 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Referrals</h1>
        <p className="text-zinc-500 text-sm mt-1">{referrals.length} total · {formatPrice(totalPaid)} paid out</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{referrals.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Referrals</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{referrals.filter(r => r.status === 'credited').length}</p>
          <p className="text-xs text-zinc-500 mt-1">Credited</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">{formatPrice(totalPaid)}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Paid Out</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-zinc-400 font-medium">Referrer</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Referred</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Reward</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Status</th>
              <th className="px-4 py-3 text-zinc-400 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td></tr>
              ))
            ) : referrals.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-zinc-500">No referrals yet.</td></tr>
            ) : referrals.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-white">{r.referrer?.name || '—'}</p>
                  <p className="text-xs text-zinc-500">{r.referrer?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{r.referred?.name || '—'}</p>
                  <p className="text-xs text-zinc-500">{r.referred?.email}</p>
                </td>
                <td className="px-4 py-3 text-purple-400 font-medium">{formatPrice(r.reward_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${r.status === 'credited' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {r.status === 'credited' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

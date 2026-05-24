'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import {
  Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, Plus, Copy,
  Upload, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { WalletTransaction, WalletTopup } from '@/types'
import toast from 'react-hot-toast'

const PRESETS = [50, 100, 200, 500, 1000]

const STATUS_STYLE: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-400/10',
  approved: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
}
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <CheckCircle className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
}

interface UserData {
  id: string; name: string; role: string; wallet_balance: number
}

export default function WalletPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<UserData | null>(null)
  const [upiId, setUpiId] = useState('streamzone@upi')
  const [upiName, setUpiName] = useState('StreamZone')
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [topups, setTopups] = useState<WalletTopup[]>([])
  const [loading, setLoading] = useState(true)

  // Top-up form state
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState(0)
  const [customAmount, setCustomAmount] = useState('')
  const [utr, setUtr] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function load() {
      const [userRes, settingsRes, txnRes, topupRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/settings'),
        fetch('/api/wallet/transactions'),
        fetch('/api/wallet/topup'),
      ])
      if (!userRes.ok) { router.push('/login'); return }
      const { user: u } = await userRes.json()
      if (!u) { router.push('/login'); return }
      setUser(u)

      if (settingsRes.ok) {
        const { settings } = await settingsRes.json()
        if (settings?.upi_id) setUpiId(settings.upi_id)
        if (settings?.upi_name) setUpiName(settings.upi_name)
      }
      if (txnRes.ok) {
        const d = await txnRes.json()
        setTransactions(d.transactions || [])
      }
      if (topupRes.ok) {
        const d = await topupRes.json()
        setTopups(d.topups || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  function selectAmount(val: number) {
    setAmount(val)
    setCustomAmount('')
  }

  function handleCustomChange(val: string) {
    setCustomAmount(val)
    setAmount(Number(val) || 0)
  }

  async function handleSubmit() {
    if (!amount || amount < 10) { toast.error('Minimum top-up is ₹10'); return }
    if (!utr.trim()) { toast.error('Enter UTR / Transaction ID'); return }
    if (!proof) { toast.error('Upload payment screenshot'); return }

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('amount', amount.toString())
      fd.append('paymentUTR', utr)
      fd.append('paymentProof', proof)
      const res = await fetch('/api/wallet/topup', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to submit'); return }
      toast.success('Top-up request submitted! We\'ll review and credit within 30 minutes.')
      setShowForm(false)
      setAmount(0); setCustomAmount(''); setUtr(''); setProof(null)
      // Refresh top-ups
      const r = await fetch('/api/wallet/topup')
      if (r.ok) { const d = await r.json(); setTopups(d.topups || []) }
    } finally {
      setSubmitting(false)
    }
  }

  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)
  const pendingTopups = topups.filter(t => t.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar user={null} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
          <div className="h-8 skeleton rounded w-40 mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-xl" />)}
          </div>
          <div className="h-96 skeleton rounded-2xl" />
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">My Wallet</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Top Up
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-4 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-purple-400/10 rounded-xl flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(user?.wallet_balance || 0)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Available Balance</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-green-400/10 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(totalCredits)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Credited</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-red-400/10 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5 text-red-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(totalDebits)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Used</p>
            </div>
          </div>
        </div>

        {/* Pending top-ups banner */}
        {pendingTopups.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              {pendingTopups.length} top-up request{pendingTopups.length > 1 ? 's' : ''} pending review.
              Usually credited within 30 minutes.
            </p>
          </div>
        )}

        {/* Top-up form */}
        {showForm && (
          <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="font-bold text-white">Add Money to Wallet</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Pay via UPI and submit your transaction details</p>
            </div>
            <div className="p-5 space-y-5">
              {/* Amount presets */}
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-2">Select Amount</label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => selectAmount(p)}
                      className={`py-2 rounded-xl text-sm font-semibold border transition-all ${
                        amount === p && !customAmount
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:border-purple-500/50 hover:text-white'
                      }`}
                    >
                      ₹{p}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  placeholder="Or enter custom amount (₹)"
                  className="input-dark"
                  min={10}
                />
                {amount > 0 && (
                  <p className="text-xs text-purple-400 mt-1.5">You are topping up: <strong>{formatPrice(amount)}</strong></p>
                )}
              </div>

              {/* UPI payment info */}
              <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4">
                <p className="text-xs text-zinc-400 mb-3">Pay exactly <strong className="text-white">{amount > 0 ? formatPrice(amount) : '₹--'}</strong> to:</p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">UPI ID</p>
                    <p className="font-bold text-white text-base font-mono">{upiId}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">Name: <span className="text-white font-semibold">{upiName}</span></p>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(upiId); toast.success('UPI ID copied!') }}
                    className="p-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-400 transition-all shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap mt-3 pt-3 border-t border-white/10">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Fampay'].map((app) => (
                    <span key={app} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-zinc-400">{app}</span>
                  ))}
                </div>
              </div>

              {/* UTR */}
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  UTR / Transaction ID <span className="text-red-400">*</span>
                </label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter 12-digit UTR number"
                  className="input-dark"
                />
                <p className="text-[10px] text-zinc-600 mt-1">Find this in your UPI app under transaction details</p>
              </div>

              {/* Screenshot */}
              <div>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                  Payment Screenshot <span className="text-red-400">*</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-xl p-5 text-center cursor-pointer transition-all"
                >
                  {proof ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">{proof.name}</span>
                    </div>
                  ) : (
                    <div className="text-zinc-500 flex flex-col items-center gap-2">
                      <Upload className="w-7 h-7" />
                      <p className="text-sm">Click to upload screenshot</p>
                      <p className="text-xs">PNG, JPG — up to 5 MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => setProof(e.target.files?.[0] || null)} />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 border border-white/20 text-zinc-400 hover:text-white rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !amount || !utr || !proof}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                    : 'Submit Top-Up Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top-up history */}
        {topups.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden mb-5">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-white/10 hover:bg-white/5 transition-colors"
            >
              <h2 className="font-semibold text-white text-sm">Top-Up Requests</h2>
              {showHistory ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
            </button>
            {showHistory && (
              <div className="divide-y divide-white/5">
                {topups.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status]}`}>
                          {STATUS_ICON[t.status]} {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </span>
                        {t.payment_proof_url && (
                          <a href={t.payment_proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-zinc-600 hover:text-purple-400 flex items-center gap-0.5 transition-colors">
                            <ExternalLink className="w-2.5 h-2.5" /> Proof
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">UTR: {t.payment_utr || '—'}</p>
                      <p className="text-[10px] text-zinc-600">{formatDateTime(t.created_at)}</p>
                      {t.admin_notes && <p className="text-xs text-zinc-500 mt-0.5 italic">{t.admin_notes}</p>}
                    </div>
                    <span className={`font-bold text-sm ${t.status === 'approved' ? 'text-green-400' : t.status === 'rejected' ? 'text-red-400' : 'text-amber-400'}`}>
                      +{formatPrice(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transaction history */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-white">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <Wallet className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === 'credit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {t.type === 'credit'
                        ? <ArrowUpRight className="w-4 h-4 text-green-400" />
                        : <ArrowDownLeft className="w-4 h-4 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.reason}</p>
                      <p className="text-xs text-zinc-500">{formatDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'credit' ? '+' : '-'}{formatPrice(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

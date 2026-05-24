'use client'
import { useState, useEffect } from 'react'
import { Search, Users, Wallet, Ban, CheckCircle, X } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { User } from '@/types'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<User | null>(null)
  const [walletAmount, setWalletAmount] = useState('')
  const [walletReason, setWalletReason] = useState('Admin credit')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) { const { users } = await res.json(); setUsers(users) }
    setLoading(false)
  }

  async function toggleActive(user: User) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !user.active }),
    })
    if (res.ok) { toast.success(`User ${user.active ? 'disabled' : 'enabled'}`); await loadUsers() }
  }

  async function addWallet() {
    if (!selected || !walletAmount || Number(walletAmount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/admin/users/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ add_wallet: Number(walletAmount), reason: walletReason }),
    })
    if (res.ok) {
      const { new_balance } = await res.json()
      toast.success(`₹${walletAmount} added! New balance: ₹${new_balance}`)
      setSelected(null)
      setWalletAmount('')
      await loadUsers()
    } else {
      toast.error('Failed to add wallet')
    }
    setSaving(false)
  }

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Users className="w-6 h-6 text-purple-400" />
        Users ({users.length})
      </h1>

      <div className="glass rounded-xl p-4 mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-dark pl-9"
          />
        </div>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['User', 'Email', 'Wallet', 'Referral Code', 'Joined', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 skeleton rounded" /></td>)}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-zinc-500">No users found</td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-purple-400">{formatPrice(user.wallet_balance)}</td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-400">{user.referral_code}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${user.active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {user.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(user)}
                          title="Add wallet balance"
                          className="p-1.5 text-zinc-500 hover:text-purple-400 hover:bg-purple-400/10 rounded-lg transition-all"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          title={user.active ? 'Disable user' : 'Enable user'}
                          className={`p-1.5 rounded-lg transition-all ${user.active ? 'text-zinc-500 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-500 hover:text-green-400 hover:bg-green-400/10'}`}
                        >
                          {user.active ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="glass border border-white/10 rounded-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-white">Add Wallet Balance</h2>
                <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Adding to <strong className="text-white">{selected.name}</strong> (current: {formatPrice(selected.wallet_balance)})</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Amount (₹) *</label>
                  <input type="number" value={walletAmount} onChange={(e) => setWalletAmount(e.target.value)} placeholder="50" className="input-dark" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Reason</label>
                  <input value={walletReason} onChange={(e) => setWalletReason(e.target.value)} className="input-dark" />
                </div>
                <button
                  onClick={addWallet}
                  disabled={saving}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
                >
                  {saving ? 'Adding...' : 'Add Balance'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

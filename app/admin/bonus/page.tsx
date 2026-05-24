'use client'

import { useState, useEffect } from 'react'
import { Gift, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface BonusSettings {
  referral_reward: string
  signup_bonus: string
  first_order_bonus: string
  min_wallet_recharge: string
  wallet_cashback_percent: string
}

export default function AdminBonusPage() {
  const [settings, setSettings] = useState<BonusSettings>({
    referral_reward: '20',
    signup_bonus: '0',
    first_order_bonus: '0',
    min_wallet_recharge: '100',
    wallet_cashback_percent: '0',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then((data: Record<string, string>) => {
      setSettings(s => ({
        ...s,
        referral_reward: data.referral_reward || '20',
        signup_bonus: data.signup_bonus || '0',
        first_order_bonus: data.first_order_bonus || '0',
        min_wallet_recharge: data.min_wallet_recharge || '100',
        wallet_cashback_percent: data.wallet_cashback_percent || '0',
      }))
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    if (res.ok) toast.success('Bonus settings saved')
    else toast.error('Failed to save')
  }

  const fields = [
    { key: 'referral_reward', label: 'Referral Reward (₹)', desc: 'Amount credited when a referred user places their first order' },
    { key: 'signup_bonus', label: 'Signup Bonus (₹)', desc: 'Wallet credit given to every new user on signup (0 = disabled)' },
    { key: 'first_order_bonus', label: 'First Order Bonus (₹)', desc: 'Wallet credit given after a user completes their first order (0 = disabled)' },
    { key: 'min_wallet_recharge', label: 'Min Wallet Recharge (₹)', desc: 'Minimum amount users can add to wallet' },
    { key: 'wallet_cashback_percent', label: 'Wallet Cashback %', desc: 'Cashback % on wallet usage (0 = disabled)' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Bonus Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure referral rewards, signup bonuses and cashback</p>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          <Gift className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <p className="text-sm text-zinc-300">These settings control how users earn wallet credits. Changes take effect immediately for new events.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-5">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-white mb-1">{f.label}</label>
                <p className="text-xs text-zinc-500 mb-2">{f.desc}</p>
                <input
                  type="number"
                  min="0"
                  value={settings[f.key as keyof BonusSettings]}
                  onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                  className="input-dark w-full"
                />
              </div>
            ))}
          </div>
        )}

        <button onClick={handleSave} disabled={saving || loading} className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Bonus Settings'}
        </button>
      </div>
    </div>
  )
}

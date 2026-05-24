'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, MessageCircle, CreditCard, Globe, Gift, Users, UserPlus, Trash2, Crown, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface TeamMember { id: string; name: string; email: string; role: string; created_at: string }

function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user?.role === 'owner') {
        setIsOwner(true)
        fetchTeam()
      } else {
        // Admin can see list but not manage
        fetchTeam()
      }
    })
  }, [])

  async function fetchTeam() {
    setLoading(true)
    const res = await fetch('/api/admin/team')
    if (res.ok) setMembers(await res.json())
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail.trim() }),
    })
    const data = await res.json()
    if (res.ok) { toast.success('Admin added!'); setNewEmail(''); fetchTeam() }
    else toast.error(data.error || 'Failed to add admin')
    setAdding(false)
  }

  async function handleRemove(id: string, name: string) {
    if (!confirm(`Remove ${name} as admin?`)) return
    setRemoving(id)
    const res = await fetch('/api/admin/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (res.ok) { toast.success('Admin removed'); fetchTeam() }
    else toast.error(data.error || 'Failed to remove')
    setRemoving(null)
  }

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
        <Users className="w-4 h-4 text-cyan-400" />
        <h2 className="font-bold text-white text-sm">Team Members</h2>
      </div>
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 skeleton rounded-xl" />)}</div>
        ) : (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'owner' ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
                    {m.role === 'owner'
                      ? <Crown className="w-4 h-4 text-amber-400" />
                      : <Shield className="w-4 h-4 text-purple-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {m.role.toUpperCase()}
                  </span>
                  {isOwner && m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(m.id, m.name)}
                      disabled={removing === m.id}
                      className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <form onSubmit={handleAdd} className="flex gap-2 pt-2">
            <input
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Enter email to add as admin"
              className="input-dark flex-1"
              required
            />
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
        )}
        {!isOwner && (
          <p className="text-xs text-zinc-600">Only the owner can add or remove admins.</p>
        )}
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => { setSettings(d.settings || {}); setLoading(false) })
  }, [])

  async function save() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) toast.success('Settings saved!')
    else toast.error('Failed to save')
    setSaving(false)
  }

  function update(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-8 skeleton rounded w-48 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}
        </div>
      </div>
    )
  }

  const sections = [
    {
      title: 'Site Info',
      icon: <Globe className="w-4 h-4 text-purple-400" />,
      fields: [
        { key: 'site_name', label: 'Site Name', placeholder: 'DIGITAL OTT' },
        { key: 'site_tagline', label: 'Tagline', placeholder: 'Premium OTT Subscriptions' },
      ],
    },
    {
      title: 'WhatsApp & Telegram',
      icon: <MessageCircle className="w-4 h-4 text-green-400" />,
      fields: [
        { key: 'whatsapp_number', label: 'WhatsApp Number (with country code, no +)', placeholder: '919999999999' },
        { key: 'telegram_username', label: 'Telegram Username (without @)', placeholder: 'xudri' },
        { key: 'telegram_bot_token', label: 'Telegram Bot Token (for notifications)', placeholder: '1234567890:ABCDEF...' },
        { key: 'telegram_admin_chat_id', label: 'Telegram Admin Chat ID', placeholder: '-1001234567890' },
      ],
    },
    {
      title: 'Payment',
      icon: <CreditCard className="w-4 h-4 text-amber-400" />,
      fields: [
        { key: 'upi_id', label: 'UPI ID', placeholder: 'yourupi@paytm' },
        { key: 'upi_name', label: 'UPI Name (shown to customer)', placeholder: 'DIGITAL OTT' },
      ],
    },
    {
      title: 'Referral & Rewards',
      icon: <Gift className="w-4 h-4 text-pink-400" />,
      fields: [
        { key: 'referral_reward', label: 'Referral Reward Amount (₹)', placeholder: '20' },
      ],
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          Settings
        </h1>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="space-y-6 max-w-2xl">
        {sections.map((section) => (
          <div key={section.title} className="glass rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
              {section.icon}
              <h2 className="font-bold text-white text-sm">{section.title}</h2>
            </div>
            <div className="p-5 space-y-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">{field.label}</label>
                  <input
                    value={settings[field.key] || ''}
                    onChange={(e) => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="input-dark"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <TeamSection />

        <div className="glass rounded-xl p-5">
          <h2 className="font-bold text-white text-sm mb-4">Danger Zone</h2>
          <p className="text-xs text-zinc-500 mb-3">
            Changes here affect the entire site. Be careful.
          </p>
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all"
          >
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  )
}

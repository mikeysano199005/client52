import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Users, Copy, Gift, CheckCircle, Clock } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Referral } from '@/types'
import BackButton from '@/components/ui/BackButton'

export default async function ReferralPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const { data: settings } = await supabaseAdmin.from('settings').select('key,value').eq('key', 'referral_reward')
  const referralReward = settings?.[0]?.value || '20'

  const { data } = await supabaseAdmin
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const referrals = (data || []) as Referral[]
  const credited = referrals.filter(r => r.status === 'credited')
  const totalEarned = credited.reduce((s, r) => s + r.reward_amount, 0)
  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referral_code}`

  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, role: user.role, wallet_balance: user.wallet_balance }} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <BackButton href="/dashboard" />
          <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        </div>

        <div className="glass rounded-2xl p-6 mb-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-lg">Earn {formatPrice(Number(referralReward))} per referral</h2>
              <p className="text-zinc-400 text-sm mt-1">Share your link. When someone signs up and places their first order, you earn ₹{referralReward} in wallet credits.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{referrals.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Referrals</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{credited.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Successful</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{formatPrice(totalEarned)}</p>
            <p className="text-xs text-zinc-500 mt-1">Total Earned</p>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 mb-6">
          <p className="text-sm text-zinc-400 mb-2">Your Referral Link</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-sm text-purple-300 bg-purple-500/10 px-3 py-2 rounded-lg truncate">
              {referralLink}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          <p className="text-xs text-zinc-500 mt-2">Your code: <span className="text-white font-mono">{user.referral_code}</span></p>
        </div>

        {referrals.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h2 className="font-semibold text-white">Referral History</h2>
            </div>
            <div className="divide-y divide-white/5">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${r.status === 'credited' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                      {r.status === 'credited'
                        ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Clock className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-white capitalize">{r.status}</p>
                      <p className="text-xs text-zinc-500">{formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${r.status === 'credited' ? 'text-green-400' : 'text-yellow-400'}`}>
                    +{formatPrice(r.reward_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import type { WalletTransaction } from '@/types'

export default async function WalletPage() {
  const user = await getSession()
  if (!user) redirect('/login')

  const { data } = await supabaseAdmin
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const transactions = (data || []) as WalletTransaction[]
  const totalCredits = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0)
  const totalDebits = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="min-h-screen">
      <Navbar user={{ name: user.name, role: user.role, wallet_balance: user.wallet_balance }} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <h1 className="text-2xl font-bold text-white mb-6">My Wallet</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="glass rounded-xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-purple-400/10 rounded-xl flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(user.wallet_balance)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Available Balance</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-green-400/10 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(totalCredits)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Credited</p>
            </div>
          </div>
          <div className="glass rounded-xl p-4 sm:p-5 flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0">
            <div className="w-9 h-9 bg-red-400/10 rounded-xl flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-5 h-5 text-red-400" />
            </div>
            <div className="sm:text-center sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-white">{formatPrice(totalDebits)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Total Used</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h2 className="font-semibold text-white">Transaction History</h2>
          </div>
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No transactions yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4">
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

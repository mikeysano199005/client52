import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import ProductCard from '@/components/product/ProductCard'
import BackButton from '@/components/ui/BackButton'
import { Tag, Flame } from 'lucide-react'
import type { Plan } from '@/types'

export const metadata = {
  title: 'Sale — DIGITAL OTT',
  description: 'Best deals on OTT subscriptions. Limited time offers on Netflix, Prime, Hotstar & more.',
}

export default async function SalePage() {
  const [user, plansRes, settingsRes] = await Promise.all([
    getSession(),
    supabaseAdmin.from('plans').select('*').eq('active', true).order('sort_order'),
    supabaseAdmin.from('settings').select('key, value').in('key', ['whatsapp_number', 'telegram_username']),
  ])

  const settings: Record<string, string> = {}
  for (const s of settingsRes.data || []) settings[s.key] = s.value

  // Only plans that have a discount
  const salePlans = ((plansRes.data || []) as Plan[])
    .filter((p) => {
      const v = p.price_variants?.[0]
      return v && v.original_price > v.price
    })
    .sort((a, b) => {
      const discA = a.price_variants[0]
        ? (a.price_variants[0].original_price - a.price_variants[0].price) / a.price_variants[0].original_price
        : 0
      const discB = b.price_variants[0]
        ? (b.price_variants[0].original_price - b.price_variants[0].price) / b.price_variants[0].original_price
        : 0
      return discB - discA
    })

  const maxDiscount = salePlans[0]
    ? Math.round(
        ((salePlans[0].price_variants[0].original_price - salePlans[0].price_variants[0].price) /
          salePlans[0].price_variants[0].original_price) *
          100
      )
    : 0

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton href="/" />
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-400" />
              Sale
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">Limited time deals — up to {maxDiscount}% off</p>
          </div>
        </div>

        {/* Banner */}
        <div className="bg-gradient-to-r from-orange-600/20 via-red-600/10 to-purple-600/20 border border-orange-500/20 rounded-2xl p-5 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Tag className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">🔥 Big Savings on OTT Subscriptions</p>
            <p className="text-zinc-400 text-sm mt-0.5">
              {salePlans.length} plan{salePlans.length !== 1 ? 's' : ''} on sale right now. Grab them before the price goes back up!
            </p>
          </div>
        </div>

        {/* Plans Grid */}
        {salePlans.length === 0 ? (
          <div className="text-center py-20">
            <Flame className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">No sale plans right now</p>
            <p className="text-zinc-600 text-sm mt-1">Check back soon for deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {salePlans.map((plan) => (
              <ProductCard key={plan.id} plan={plan} compact />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <FloatingButtons
        whatsappNumber={settings.whatsapp_number}
        telegramUsername={settings.telegram_username}
      />
    </div>
  )
}

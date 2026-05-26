import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import ProductCard from '@/components/product/ProductCard'
import BackButton from '@/components/ui/BackButton'
import { Search, PackageSearch } from 'lucide-react'
import type { Plan } from '@/types'

export const metadata = {
  title: 'Search — DIGITAL OTT',
}

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q || '').trim()

  const [user, settingsRes] = await Promise.all([
    getSession(),
    supabaseAdmin.from('settings').select('key, value').in('key', ['whatsapp_number', 'telegram_username']),
  ])

  const settings: Record<string, string> = {}
  for (const s of settingsRes.data || []) settings[s.key] = s.value

  let results: Plan[] = []

  if (query) {
    const { data } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('active', true)
      .ilike('name', `%${query}%`)
      .order('sort_order')
    results = (data || []) as Plan[]
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton href="/" />
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-400" />
              Search Results
            </h1>
            {query && (
              <p className="text-zinc-500 text-sm mt-0.5">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
              </p>
            )}
          </div>
        </div>

        {/* Results */}
        {!query ? (
          <div className="text-center py-24">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Type something to search</p>
            <p className="text-zinc-600 text-sm mt-1">Try &quot;Netflix&quot;, &quot;Prime&quot;, &quot;Hotstar&quot;…</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-24">
            <PackageSearch className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">No plans found for &quot;{query}&quot;</p>
            <p className="text-zinc-600 text-sm mt-1">Try a different keyword</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {results.map((plan) => (
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

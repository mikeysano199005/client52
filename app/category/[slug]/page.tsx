import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import ProductCard from '@/components/product/ProductCard'
import type { Plan } from '@/types'
import { CATEGORIES } from '@/lib/utils'

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const user = await getSession()

  const category = CATEGORIES.find((c) => c.toLowerCase().replace(/\s+/g, '-') === slug) || slug

  const { data } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('active', true)
    .ilike('category', category)
    .order('sort_order')

  const plans = (data || []) as Plan[]

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white capitalize">{category} Plans</h1>
          <p className="text-zinc-500 text-sm mt-1">{plans.length} plans available</p>
        </div>

        {plans.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <p className="text-zinc-500">No plans found in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {plans.map((plan) => (
              <ProductCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  )
}

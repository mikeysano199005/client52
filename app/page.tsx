import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import HeroBanner from '@/components/home/HeroBanner'
import ActivityTicker from '@/components/home/ActivityTicker'
import CategoryRow from '@/components/home/CategoryRow'
import TopSellers from '@/components/home/TopSellers'
import PromoBanners from '@/components/home/PromoBanners'
import ReviewsSection from '@/components/home/ReviewsSection'
import FAQSection from '@/components/home/FAQSection'
import ProductCard from '@/components/product/ProductCard'
import type { Plan, Review } from '@/types'

async function getData() {
  const [plansRes, reviewsRes, settingsRes] = await Promise.all([
    supabaseAdmin.from('plans').select('*').eq('active', true).order('sort_order'),
    supabaseAdmin.from('reviews').select('*').eq('active', true).order('created_at', { ascending: false }).limit(6),
    supabaseAdmin.from('settings').select('key, value').in('key', ['whatsapp_number', 'telegram_username']),
  ])

  const plans = (plansRes.data || []) as Plan[]
  const reviews = (reviewsRes.data || []) as Review[]
  const settings: Record<string, string> = {}
  for (const s of settingsRes.data || []) settings[s.key] = s.value

  return { plans, reviews, settings }
}

export default async function HomePage() {
  const [user, { plans, reviews, settings }] = await Promise.all([getSession(), getData()])

  const featured = plans.filter((p) => p.featured)
  const discounted = [...plans].sort((a, b) => {
    const discA = a.price_variants[0]
      ? (a.price_variants[0].original_price - a.price_variants[0].price) / a.price_variants[0].original_price
      : 0
    const discB = b.price_variants[0]
      ? (b.price_variants[0].original_price - b.price_variants[0].price) / b.price_variants[0].original_price
      : 0
    return discB - discA
  })

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />
      <div className="pt-14 lg:pt-16">
        <ActivityTicker />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <HeroBanner plans={featured} banners={[]} discountedPlans={discounted} />
        <CategoryRow />
        <TopSellers plans={plans} />
        <PromoBanners />

        {/* All Plans Grid */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">All Plans</h2>
              <p className="text-sm text-zinc-500">{plans.length} plans available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {plans.map((plan) => (
              <ProductCard key={plan.id} plan={plan} compact />
            ))}
          </div>
        </section>

        <ReviewsSection reviews={reviews} />
        <FAQSection />
      </main>

      <Footer />
      <FloatingButtons
        whatsappNumber={settings.whatsapp_number}
        telegramUsername={settings.telegram_username}
      />
    </div>
  )
}

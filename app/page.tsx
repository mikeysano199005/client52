import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'
import HeroBanner from '@/components/home/HeroBanner'
import CategoryRow from '@/components/home/CategoryRow'
import TopSellers from '@/components/home/TopSellers'
import PromoBanners from '@/components/home/PromoBanners'
import ReviewsSection from '@/components/home/ReviewsSection'
import FAQSection from '@/components/home/FAQSection'
import type { Plan, Review } from '@/types'
import { getPlanLogo } from '@/lib/logos'

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
            {plans.map((plan) => {
              const cheapest = plan.price_variants[0]
              if (!cheapest) return null
              const discount = Math.round(
                ((cheapest.original_price - cheapest.price) / cheapest.original_price) * 100
              )
              return (
                <a
                  key={plan.id}
                  href={`/product/${plan.id}`}
                  className="glass glass-hover rounded-xl overflow-hidden group"
                >
                  <div className="h-32 bg-gradient-to-br from-purple-950/60 to-zinc-950 flex items-center justify-center relative overflow-hidden">
                    {getPlanLogo(plan.name, plan.image_url) ? (
                      <img
                        src={getPlanLogo(plan.name, plan.image_url)!}
                        alt={plan.name}
                        className="w-3/4 max-h-14 object-contain drop-shadow-lg"
                        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; (t.nextElementSibling as HTMLElement)?.classList.remove('hidden') }}
                      />
                    ) : null}
                    <div className={`w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black text-white ${getPlanLogo(plan.name, plan.image_url) ? 'hidden' : ''}`}>
                      {plan.name[0]}
                    </div>
                    {plan.badge && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold text-white bg-purple-600 px-1.5 py-0.5 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold text-white bg-green-600 px-1.5 py-0.5 rounded-full">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                      {plan.name}
                    </p>
                    <p className="text-sm font-bold text-white mt-1">₹{cheapest.price}</p>
                    <p className="text-[10px] text-zinc-500 line-through">₹{cheapest.original_price}</p>
                  </div>
                </a>
              )
            })}
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

'use client'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import type { Plan } from '@/types'
import { formatPrice, getDiscount } from '@/lib/utils'
import { getPlanLogo, getPlanCardBg } from '@/lib/logos'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'

const Countdown = dynamic(() => import('@/components/ui/Countdown'), { ssr: false })

interface ProductCardProps {
  plan: Plan
  compact?: boolean
}

const BADGE_CLASS: Record<string, string> = {
  HOT: 'badge-hot',
  NEW: 'badge-new',
  'BEST VALUE': 'badge-best',
  'BEST DEAL': 'badge-deal',
}

export default function ProductCard({ plan, compact = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const cheapestVariant = plan.price_variants[0]
  const discount = cheapestVariant
    ? getDiscount(cheapestVariant.original_price, cheapestVariant.price)
    : 0

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!cheapestVariant) return
    addItem(plan, cheapestVariant)
    toast.success(`${plan.name} added to cart!`)
  }

  const logo = getPlanLogo(plan.name, plan.image_url)
  // Built-in SVG logos: contain, shown on brand-colored dark gradient bg
  // Custom uploaded images: cover the full area (no bg issue)
  const isBuiltinLogo = logo?.startsWith('/logos/')
  const cardBg = isBuiltinLogo ? getPlanCardBg(plan.name) : '#111113'

  return (
    <Link href={`/product/${plan.id}`} className="block group">
      <div className="glass rounded-xl overflow-hidden transition-all duration-200 group-hover:-translate-y-1 group-hover:border-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-900/20">

        {/* Image area: brand gradient (dark) → white (light mode via CSS !important) */}
        <div
          className={`card-img-area relative ${compact ? 'h-28' : 'h-36'} overflow-hidden`}
          style={{ background: cardBg }}
        >
          {logo ? (
            <img
              src={logo}
              alt={plan.name}
              loading="lazy"
              className={`absolute inset-0 w-full h-full ${isBuiltinLogo ? 'object-contain p-5' : 'object-cover'}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600/40 to-cyan-600/20 border border-white/10 flex items-center justify-center text-2xl font-black text-white">
                {plan.name[0]}
              </div>
            </div>
          )}

          {/* Badge */}
          {plan.badge && (
            <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full z-10 ${BADGE_CLASS[plan.badge] || 'bg-purple-600'}`}>
              {plan.badge}
            </span>
          )}

          {/* Discount */}
          {discount > 0 && (
            <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-green-600 px-2 py-0.5 rounded-full z-10">
              -{discount}%
            </span>
          )}

          {/* Out of stock */}
          {plan.stock_count === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-3 py-1 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Countdown */}
          {plan.countdown_ends_at && new Date(plan.countdown_ends_at) > new Date() && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1.5 z-10">
              <Countdown endsAt={plan.countdown_ends_at} compact />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm truncate group-hover:text-purple-400 transition-colors">
            {plan.name}
          </h3>

          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs text-zinc-400">
              {plan.rating.toFixed(1)} ({plan.review_count})
            </span>
          </div>

          {cheapestVariant && (
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-bold text-white">
                    {formatPrice(cheapestVariant.price)}
                  </span>
                  <span className="text-xs text-zinc-500 line-through">
                    {formatPrice(cheapestVariant.original_price)}
                  </span>
                </div>
                {!compact && (
                  <p className="text-[10px] text-zinc-500">Starting from / {cheapestVariant.label}</p>
                )}
              </div>

              {!compact && (
                <button
                  onClick={handleAddToCart}
                  disabled={plan.stock_count === 0}
                  className="p-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-all text-white"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="h-36 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/3" />
        <div className="h-5 skeleton w-1/2" />
      </div>
    </div>
  )
}

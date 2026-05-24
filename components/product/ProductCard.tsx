'use client'
import Link from 'next/link'
import { Star, ShoppingCart, Zap } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCartStore } from '@/store/cartStore'
import type { Plan } from '@/types'
import { formatPrice, getDiscount } from '@/lib/utils'
import { getPlanLogo } from '@/lib/logos'
import toast from 'react-hot-toast'

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

const PLATFORM_COLORS: Record<string, string> = {
  Netflix: 'from-red-900/40 to-zinc-900',
  Amazon: 'from-blue-900/40 to-zinc-900',
  Prime: 'from-blue-900/40 to-zinc-900',
  Hotstar: 'from-blue-800/40 to-zinc-900',
  Jio: 'from-indigo-900/40 to-zinc-900',
  YouTube: 'from-red-900/40 to-zinc-900',
  Zee5: 'from-purple-900/40 to-zinc-900',
  Sony: 'from-blue-900/40 to-zinc-900',
  Spotify: 'from-green-900/40 to-zinc-900',
  Combo: 'from-purple-900/40 to-cyan-900/20',
  OTT: 'from-purple-900/40 to-zinc-900',
}

function getPlatformGradient(name: string) {
  for (const key of Object.keys(PLATFORM_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return PLATFORM_COLORS[key]
  }
  return 'from-zinc-900 to-zinc-900'
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

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Link href={`/product/${plan.id}`} className="block group">
        <div
          className={`glass glass-hover rounded-xl overflow-hidden relative ${
            compact ? 'p-0' : 'p-0'
          }`}
        >
          {/* Image / Gradient area */}
          <div
            className={`relative bg-gradient-to-br ${getPlatformGradient(plan.name)} ${
              compact ? 'h-32' : 'h-44'
            } flex items-center justify-center overflow-hidden`}
          >
            {(() => {
              const logo = getPlanLogo(plan.name, plan.image_url)
              return logo ? (
                <img
                  src={logo}
                  alt={plan.name}
                  className="w-3/4 max-h-16 object-contain drop-shadow-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden') }}
                />
              ) : null
            })()}
            <div className={`w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black text-white backdrop-blur-sm ${getPlanLogo(plan.name, plan.image_url) ? 'hidden' : ''}`}>
              {plan.name[0]}
            </div>

            {/* Badge */}
            {plan.badge && (
              <span
                className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${
                  BADGE_CLASS[plan.badge] || 'bg-purple-600'
                }`}
              >
                {plan.badge}
              </span>
            )}

            {/* Discount */}
            {discount > 0 && (
              <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-green-600 px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}

            {/* Out of stock */}
            {plan.stock_count === 0 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-xs font-semibold text-zinc-300 bg-zinc-800 px-3 py-1 rounded-full">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-purple-400 transition-colors">
              {plan.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-zinc-400">
                {plan.rating.toFixed(1)} ({plan.review_count})
              </span>
            </div>

            {/* Price */}
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
    </motion.div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="h-44 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-3 skeleton w-1/3" />
        <div className="h-5 skeleton w-1/2" />
      </div>
    </div>
  )
}

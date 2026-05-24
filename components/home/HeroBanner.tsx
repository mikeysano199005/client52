'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Zap, Star } from 'lucide-react'
import type { Plan, Banner } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getPlanLogo, getPlanCardBg } from '@/lib/logos'

interface HeroBannerProps {
  plans: Plan[]
  banners: Banner[]
  discountedPlans: Plan[]
}

// Using raw CSS gradients (not Tailwind classes) so light-mode class overrides can't touch them
const PLATFORM_GRADIENTS_CSS: Record<string, string> = {
  netflix:    'linear-gradient(135deg, #3b0000 0%, rgba(127,29,29,0.65) 45%, #09090b 100%)',
  amazon:     'linear-gradient(135deg, #000e28 0%, rgba(30,58,138,0.65) 45%, #09090b 100%)',
  prime:      'linear-gradient(135deg, #000e28 0%, rgba(30,58,138,0.65) 45%, #09090b 100%)',
  hotstar:    'linear-gradient(135deg, #00001f 0%, rgba(49,46,129,0.60) 45%, #09090b 100%)',
  disney:     'linear-gradient(135deg, #00001f 0%, rgba(49,46,129,0.60) 45%, #09090b 100%)',
  jio:        'linear-gradient(135deg, #00001a 0%, rgba(67,56,202,0.55) 45%, #09090b 100%)',
  youtube:    'linear-gradient(135deg, #200000 0%, rgba(153,27,27,0.55) 45%, #09090b 100%)',
  zee5:       'linear-gradient(135deg, #1e0040 0%, rgba(88,28,135,0.60) 45%, #09090b 100%)',
  sony:       'linear-gradient(135deg, #00102a 0%, rgba(29,78,216,0.50) 45%, #09090b 100%)',
  spotify:    'linear-gradient(135deg, #001a06 0%, rgba(21,128,61,0.55) 45%, #09090b 100%)',
}

function getPlatformGradCSS(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, grad] of Object.entries(PLATFORM_GRADIENTS_CSS)) {
    if (lower.includes(key)) return grad
  }
  return 'linear-gradient(135deg, #1a0040 0%, rgba(76,29,149,0.55) 45%, #09090b 100%)'
}

export default function HeroBanner({ plans, discountedPlans }: HeroBannerProps) {
  const featured = plans.filter((p) => p.featured).slice(0, 5)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (featured.length === 0) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % featured.length), 5000)
    return () => clearInterval(timer)
  }, [featured.length])

  const prev = () => setCurrent((c) => (c - 1 + featured.length) % featured.length)
  const next = () => setCurrent((c) => (c + 1) % featured.length)

  if (featured.length === 0) return null

  const plan = featured[current]
  const cheapest = plan.price_variants[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 pt-16 sm:pt-20">
      {/* Main slider — base bg is always near-black so light mode can't wash it out */}
      <div className="relative rounded-2xl overflow-hidden h-[240px] sm:h-[320px] lg:h-[400px]" style={{ background: '#09090b' }}>
        {/* Brand gradient — inline style, immune to CSS class overrides in any theme */}
        <AnimatePresence mode="wait">
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
            style={{ background: getPlatformGradCSS(plan.name) }}
          />
        </AnimatePresence>

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
        }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Text protection: dark vignette from bottom so text always pops */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.25) 50%, transparent 80%)' }} />

        {/* Content */}
        <div className="hero-text-zone relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={plan.id + '-content'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
            >
              {/* Platform logo + name */}
              {(() => {
                const heroLogo = getPlanLogo(plan.name, plan.image_url)
                const heroIsBuiltin = heroLogo?.startsWith('/logos/')
                return (
              <div className="flex items-center gap-3 mb-3">
                {heroLogo ? (
                  heroIsBuiltin
                    ? <img src={heroLogo} alt={plan.name} className="h-10 max-w-[180px] object-contain drop-shadow-lg" />
                    : <img src={heroLogo} alt={plan.name} className="h-10 w-10 object-cover rounded-lg drop-shadow-lg" />
                ) : null}
                <div>
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                    {!heroIsBuiltin ? plan.name : ''}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{cheapest?.quality}</span>
                    <span>•</span>
                    <span>{cheapest?.access}</span>
                    <span>•</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                    <span className="text-amber-400">{plan.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
                )
              })()}

              {plan.description && (
                <p className="hidden sm:block text-sm text-zinc-400 mb-4 max-w-lg line-clamp-2 drop-shadow">{plan.description}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={`/product/${plan.id}`}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all glow-purple-sm flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Buy Now
                </Link>
                {cheapest && (
                  <div>
                    <span className="text-xs text-zinc-500">Starting at</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-white">{formatPrice(cheapest.price)}</span>
                      <span className="text-sm text-zinc-500 line-through">{formatPrice(cheapest.original_price)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots + arrows */}
          <div className="flex items-center gap-3 mt-5">
            <button onClick={prev} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <ChevronLeft className="w-3.5 h-3.5 text-white" />
            </button>
            <div className="flex items-center gap-1.5">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`transition-all rounded-full ${
                    i === current ? 'w-6 h-1.5 bg-purple-500' : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
            <button onClick={next} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Discounted sidebar */}
      <div className="glass rounded-2xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Hot Deals</h3>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
          {discountedPlans.slice(0, 6).map((p) => {
            const v = p.price_variants[0]
            if (!v) return null
            const disc = Math.round(((v.original_price - v.price) / v.original_price) * 100)
            const hotLogo = getPlanLogo(p.name, p.image_url)
            const hotLogoIsBuiltin = hotLogo?.startsWith('/logos/')
            const hotBg = hotLogoIsBuiltin ? getPlanCardBg(p.name) : '#111113'
            return (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="card-img-area w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-white/10" style={{ background: hotBg }}>
                  {hotLogo
                    ? <img src={hotLogo} alt={p.name} className={`w-full h-full ${hotLogoIsBuiltin ? 'object-contain p-1.5' : 'object-cover'}`} />
                    : <span className="text-sm font-black text-white">{p.name[0]}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] text-zinc-500">{p.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white">{formatPrice(v.price)}</p>
                  <p className="text-[10px] text-red-400 line-through">{formatPrice(v.original_price)}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

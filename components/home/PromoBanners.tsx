'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Crown } from 'lucide-react'

export default function PromoBanners() {
  return (
    <section className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Banner 1 - Combo deal */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden h-40 cursor-pointer group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-red-900/60 to-zinc-950" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(239,68,68,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.2) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-center p-6">
          <span className="text-xs text-red-400 font-semibold uppercase tracking-widest mb-1">Limited Time</span>
          <h3 className="text-xl font-black text-white mb-1">Netflix + Prime</h3>
          <p className="text-sm text-zinc-400 mb-3">Bundle combo — save 60%</p>
          <Link
            href="/category/combos"
            className="flex items-center gap-1.5 text-sm text-white bg-red-600 hover:bg-red-500 w-fit px-4 py-1.5 rounded-lg transition-all font-medium group-hover:gap-2.5"
          >
            <Zap className="w-3.5 h-3.5" />
            Buy Combo
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-red-800/40 text-8xl font-black select-none">
          N+
        </div>
      </motion.div>

      {/* Banner 2 - OTT hub */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="relative rounded-2xl overflow-hidden h-40 cursor-pointer group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-cyan-900/30 to-zinc-950" />
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(rgba(139,92,246,0.4) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-center p-6">
          <span className="text-xs text-purple-400 font-semibold uppercase tracking-widest mb-1">Top OTT</span>
          <h3 className="text-xl font-black text-white mb-1">All Platforms</h3>
          <p className="text-sm text-zinc-400 mb-3">Netflix, Prime, Hotstar & 20+ more</p>
          <Link
            href="/category/ott"
            className="flex items-center gap-1.5 text-sm text-white bg-purple-600 hover:bg-purple-500 w-fit px-4 py-1.5 rounded-lg transition-all font-medium group-hover:gap-2.5"
          >
            <Crown className="w-3.5 h-3.5" />
            Shop OTT
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-wrap gap-1.5 w-28 opacity-30 pointer-events-none">
          {['N', 'P', 'H', 'Z', 'Y', 'D'].map((l) => (
            <span key={l} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-sm font-black">
              {l}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

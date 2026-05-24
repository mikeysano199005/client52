'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tv, Gamepad2, Wifi, Zap, Star, Package2, Key, LayoutGrid } from 'lucide-react'

const CATEGORIES = [
  {
    label: 'All',
    slug: 'all',
    icon: <LayoutGrid className="w-6 h-6" />,
    gradient: 'from-slate-500 via-slate-600 to-slate-700',
    glow: 'hover:shadow-slate-500/40',
    ring: 'hover:ring-slate-500/50',
  },
  {
    label: 'OTT',
    slug: 'ott',
    icon: <Tv className="w-6 h-6" />,
    gradient: 'from-violet-600 via-purple-600 to-purple-700',
    glow: 'hover:shadow-purple-500/40',
    ring: 'hover:ring-purple-500/50',
  },
  {
    label: 'Combos',
    slug: 'combos',
    icon: <Package2 className="w-6 h-6" />,
    gradient: 'from-cyan-500 via-teal-500 to-teal-600',
    glow: 'hover:shadow-cyan-500/40',
    ring: 'hover:ring-cyan-500/50',
  },
  {
    label: 'Games',
    slug: 'games',
    icon: <Gamepad2 className="w-6 h-6" />,
    gradient: 'from-emerald-500 via-green-500 to-green-600',
    glow: 'hover:shadow-green-500/40',
    ring: 'hover:ring-green-500/50',
  },
  {
    label: 'VPN',
    slug: 'vpn',
    icon: <Wifi className="w-6 h-6" />,
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    glow: 'hover:shadow-blue-500/40',
    ring: 'hover:ring-blue-500/50',
  },
  {
    label: 'Utilities',
    slug: 'utilities',
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-orange-500 via-orange-600 to-amber-600',
    glow: 'hover:shadow-orange-500/40',
    ring: 'hover:ring-orange-500/50',
  },
  {
    label: 'Premium',
    slug: 'premium',
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-amber-400 via-yellow-500 to-orange-500',
    glow: 'hover:shadow-amber-400/40',
    ring: 'hover:ring-amber-400/50',
  },
  {
    label: 'Digital Keys',
    slug: 'digital-keys',
    icon: <Key className="w-6 h-6" />,
    gradient: 'from-pink-500 via-rose-500 to-pink-600',
    glow: 'hover:shadow-pink-500/40',
    ring: 'hover:ring-pink-500/50',
  },
]

export default function CategoryRow() {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
            className="shrink-0"
          >
            <Link
              href={cat.slug === 'all' ? '/' : `/category/${cat.slug}`}
              className="flex flex-col items-center gap-2.5 group"
            >
              <div className={`
                relative w-16 h-16 rounded-2xl
                bg-gradient-to-br ${cat.gradient}
                flex items-center justify-center text-white
                shadow-lg ${cat.glow}
                ring-2 ring-transparent ${cat.ring}
                transition-all duration-300
                group-hover:scale-110 group-hover:shadow-xl
              `}>
                {/* Shine overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-60" />
                <div className="relative z-10 drop-shadow-sm">
                  {cat.icon}
                </div>
              </div>
              <span className="text-xs font-medium text-zinc-400 group-hover:text-white transition-colors duration-200 whitespace-nowrap">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

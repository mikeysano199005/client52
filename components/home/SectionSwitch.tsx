'use client'
import { useState, useEffect } from 'react'
import { ArrowUpDown } from 'lucide-react'
import HeroBanner from './HeroBanner'
import TopSellers from './TopSellers'
import type { Plan } from '@/types'

const LS_KEY = 'digitalott-section-order'

interface Props {
  featured: Plan[]
  discountedPlans: Plan[]
  plans: Plan[]
}

export default function SectionSwitch({ featured, discountedPlans, plans }: Props) {
  // false = Hot Deals first (default), true = Top Sellers first
  const [topFirst, setTopFirst] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'topsellers') setTopFirst(true)
    setMounted(true)
  }, [])

  function toggle() {
    const next = !topFirst
    setTopFirst(next)
    localStorage.setItem(LS_KEY, next ? 'topsellers' : 'hotdeals')
  }

  const hotDeals = <HeroBanner plans={featured} banners={[]} discountedPlans={discountedPlans} />
  const topSellers = <TopSellers plans={plans} />

  return (
    <>
      {/* Switch button */}
      <div className="flex justify-end mt-4 mb-1">
        <button
          onClick={toggle}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-zinc-400 hover:text-white text-xs font-medium rounded-xl transition-all"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          {topFirst ? 'Show Hot Deals First' : 'Show Top Sellers First'}
        </button>
      </div>

      {mounted && topFirst ? (
        <>
          {topSellers}
          {hotDeals}
        </>
      ) : (
        <>
          {hotDeals}
          {topSellers}
        </>
      )}
    </>
  )
}

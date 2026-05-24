'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Plan } from '@/types'
import ProductCard, { ProductCardSkeleton } from '@/components/product/ProductCard'

interface TopSellersProps {
  plans: Plan[]
  loading?: boolean
}

export default function TopSellers({ plans, loading }: TopSellersProps) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-white">Top Sellers</h2>
          <p className="text-sm text-zinc-500">Most popular subscriptions</p>
        </div>
        <Link
          href="/all"
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Shop All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : plans.slice(0, 6).map((plan) => (
              <div key={plan.id}>
                <ProductCard plan={plan} />
              </div>
            ))}
      </div>
    </section>
  )
}

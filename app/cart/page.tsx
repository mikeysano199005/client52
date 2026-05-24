'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Trash2, ArrowRight, Zap, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { getPlanLogo } from '@/lib/logos'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'

export default function CartPage() {
  const { items, removeItem, total, count } = useCartStore()
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; role: string; wallet_balance: number } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => setUser(d.user))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-purple-400" />
          Your Cart
          {count() > 0 && (
            <span className="text-sm font-normal text-zinc-500 ml-1">({count()} items)</span>
          )}
        </h1>

        {count() === 0 ? (
          <div className="glass rounded-2xl p-8 sm:p-16 text-center">
            <ShoppingCart className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Your cart is empty</h2>
            <p className="text-zinc-500 mb-6">Add some amazing OTT plans to get started</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all"
            >
              Browse Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={`${item.plan.id}-${item.variant.label}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3"
                  >
                    <div className="card-img w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-white/10 shrink-0 overflow-hidden relative">
                      {getPlanLogo(item.plan.name, item.plan.image_url) ? (
                        <img src={getPlanLogo(item.plan.name, item.plan.image_url)!} alt={item.plan.name} className="absolute inset-0 w-full h-full object-contain p-1.5"
                          onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; (t.nextElementSibling as HTMLElement)?.classList.remove('hidden') }} />
                      ) : null}
                      <span className={`absolute inset-0 flex items-center justify-center text-lg font-black text-white ${getPlanLogo(item.plan.name, item.plan.image_url) ? 'hidden' : ''}`}>{item.plan.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{item.plan.name}</p>
                      <p className="text-xs text-zinc-500">{item.variant.label} • {item.variant.quality}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-white text-sm">{formatPrice(item.variant.price)}</p>
                      <p className="text-xs text-zinc-500 line-through">{formatPrice(item.variant.original_price)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.plan.id, item.variant.label)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="glass rounded-xl p-5 h-fit space-y-4">
              <h2 className="font-bold text-white">Order Summary</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={`${item.plan.id}-${item.variant.label}`} className="flex justify-between text-sm">
                    <span className="text-zinc-400 truncate mr-2">{item.plan.name} ({item.variant.label})</span>
                    <span className="text-white shrink-0">{formatPrice(item.variant.price)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="font-bold text-white">Total</span>
                <span className="font-bold text-lg text-white">{formatPrice(total())}</span>
              </div>

              <button
                onClick={() => {
                  if (!user) { router.push('/login'); return }
                  router.push('/checkout')
                }}
                className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Proceed to Checkout
              </button>

              <Link href="/" className="block text-center text-sm text-zinc-500 hover:text-purple-400 transition-colors">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}

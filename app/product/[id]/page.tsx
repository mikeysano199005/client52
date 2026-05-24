'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Star, ShoppingCart, Zap, ChevronRight, BadgeCheck,
  MessageCircle, Shield, Clock, RefreshCw
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice, getDiscount, ORDER_STATUS_LABELS } from '@/lib/utils'
import { getPlanLogo, getPlanCardBg } from '@/lib/logos'
import type { Plan, PlanVariant, Review } from '@/types'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import FloatingButtons from '@/components/layout/FloatingButtons'

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedPlans, setRelatedPlans] = useState<Plan[]>([])
  const [selectedVariant, setSelectedVariant] = useState<PlanVariant | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ name: string; role: string; wallet_balance: number } | null>(null)
  const addItem = useCartStore((s) => s.addItem)

  // Review form state
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewName, setReviewName] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    async function load() {
      const [planRes, userRes] = await Promise.all([
        fetch(`/api/plans/${params.id}`),
        fetch('/api/auth/me'),
      ])
      if (planRes.ok) {
        const { plan: p, reviews: r, related } = await planRes.json()
        setPlan(p)
        setReviews(r || [])
        setRelatedPlans(related || [])
        if (p?.price_variants?.[0]) setSelectedVariant(p.price_variants[0])
      } else {
        router.push('/')
      }
      if (userRes.ok) {
        const { user: u } = await userRes.json()
        setUser(u)
        if (u?.name) setReviewName(u.name)
      }
      setLoading(false)
    }
    load()
  }, [params.id, router])

  function handleAddToCart() {
    if (!plan || !selectedVariant) return
    addItem(plan, selectedVariant)
    toast.success('Added to cart!')
  }

  function handleBuyNow() {
    if (!plan || !selectedVariant) return
    addItem(plan, selectedVariant)
    router.push('/cart')
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!plan || reviewRating === 0) return
    if (!reviewName.trim()) { toast.error('Please enter your name'); return }
    setReviewSubmitting(true)
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, rating: reviewRating, name: reviewName, review_body: reviewBody }),
    })
    setReviewSubmitting(false)
    if (res.ok) {
      setReviewSubmitted(true)
      setReviewRating(0)
      setReviewBody('')
      toast.success('Review submitted! Thank you.')
      // Refresh reviews
      const r = await fetch(`/api/plans/${params.id}`)
      if (r.ok) { const { reviews: newR } = await r.json(); setReviews(newR || []) }
    } else {
      toast.error('Failed to submit review. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b]">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto px-4 pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80 skeleton rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 skeleton w-2/3 rounded" />
              <div className="h-4 skeleton w-1/3 rounded" />
              <div className="h-24 skeleton rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!plan) return null
  const discount = selectedVariant
    ? getDiscount(selectedVariant.original_price, selectedVariant.price)
    : 0

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-16 sm:pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
          <Link href="/" className="hover:text-purple-400">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/category/${plan.category.toLowerCase()}`} className="hover:text-purple-400">
            {plan.category}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300">{plan.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Image + Trust badges */}
          <div className="space-y-4">
            {(() => {
              const detailLogo = getPlanLogo(plan.name, plan.image_url)
              const detailIsBuiltin = detailLogo?.startsWith('/logos/')
              const detailBg = detailIsBuiltin ? getPlanCardBg(plan.name) : '#111113'
              return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-img-area rounded-2xl overflow-hidden h-52 sm:h-72 relative"
              style={{ background: detailBg }}
            >
              {detailLogo ? (
                <img
                  src={detailLogo}
                  alt={plan.name}
                  className={`absolute inset-0 w-full h-full ${detailIsBuiltin ? 'object-contain p-8' : 'object-cover'}`}
                  onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; (t.nextElementSibling as HTMLElement)?.classList.remove('hidden') }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center ${detailLogo ? 'hidden' : ''}`}>
                <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-5xl font-black text-white">
                  {plan.name[0]}
                </div>
              </div>
              {plan.badge && (
                <span className="absolute top-4 left-4 text-xs font-bold text-white bg-purple-600 px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-4 right-4 text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full">
                  {discount}% OFF
                </span>
              )}
            </motion.div>
              )
            })()}

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Zap className="w-4 h-4 text-amber-400" />, label: 'Fast Delivery' },
                { icon: <Shield className="w-4 h-4 text-green-400" />, label: '100% Genuine' },
                { icon: <RefreshCw className="w-4 h-4 text-blue-400" />, label: 'Free Replacement' },
              ].map((b) => (
                <div key={b.label} className="glass rounded-xl p-3 flex flex-col items-center gap-1 text-center">
                  {b.icon}
                  <span className="text-xs text-zinc-400">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details + Purchase */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-5"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{plan.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(plan.rating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                  ))}
                </div>
                <span className="text-sm text-zinc-400">{plan.rating.toFixed(1)} ({plan.review_count} reviews)</span>
                {plan.stock_count > 0 ? (
                  <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">In Stock</span>
                ) : (
                  <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Out of Stock</span>
                )}
              </div>
            </div>

            {plan.description && (
              <p className="text-sm text-zinc-400 leading-relaxed">{plan.description}</p>
            )}

            {/* Variant selector */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Select Plan</p>
              <div className="grid grid-cols-2 gap-2">
                {plan.price_variants.map((v) => {
                  const isSelected = selectedVariant?.label === v.label
                  const vDisc = getDiscount(v.original_price, v.price)
                  return (
                    <button
                      key={v.label}
                      onClick={() => setSelectedVariant(v)}
                      className={`variant-card p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'variant-card-selected border-purple-500 bg-purple-500/10 glow-purple-sm'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{v.label}</span>
                        {vDisc > 0 && (
                          <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                            -{vDisc}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base font-bold text-white">{formatPrice(v.price)}</span>
                        <span className="text-xs text-zinc-500 line-through">{formatPrice(v.original_price)}</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{v.quality} • {v.access}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price summary */}
            {selectedVariant && (
              <div className="glass rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Total Price</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-white">{formatPrice(selectedVariant.price)}</span>
                      <span className="text-sm text-zinc-500 line-through">{formatPrice(selectedVariant.original_price)}</span>
                      <span className="text-sm text-green-400">Save {formatPrice(selectedVariant.original_price - selectedVariant.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBuyNow}
                disabled={plan.stock_count === 0}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                disabled={plan.stock_count === 0}
                className="flex-1 py-3.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl border border-white/20 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
            </div>

            {/* Support */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <MessageCircle className="w-4 h-4" />
              <span>Need help? Contact us on WhatsApp or Telegram</span>
            </div>
          </motion.div>
        </div>

        {/* Specification table */}
        <div className="mt-12 glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Plans Available', value: plan.price_variants.map((v) => v.label).join(', ') },
              { label: 'Quality', value: [...new Set(plan.price_variants.map((v) => v.quality))].join(', ') },
              { label: 'Access', value: [...new Set(plan.price_variants.map((v) => v.access))].join(', ') },
              { label: 'Category', value: plan.category },
              { label: 'Delivery', value: 'Within 1-6 hours' },
              { label: 'Support', value: 'WhatsApp + Telegram' },
            ].map((spec) => (
              <div key={spec.label} className="border-b border-white/10 pb-3">
                <p className="text-xs text-zinc-500 mb-1">{spec.label}</p>
                <p className="text-sm text-white font-medium">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white mb-4">Customer Reviews</h2>
          {reviews.length === 0 ? (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-zinc-500 text-sm">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="glass rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                      {r.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white">{r.name}</p>
                        {r.verified && <BadgeCheck className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{r.body}</p>
                  {r.admin_reply && (
                    <div className="mt-3 pl-3 border-l-2 border-purple-500/40">
                      <p className="text-xs text-purple-400 font-semibold mb-0.5">DIGITAL OTT</p>
                      <p className="text-xs text-zinc-500">{r.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review */}
        <div className="mt-8 glass rounded-2xl p-6">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            Write a Review
          </h3>

          {reviewSubmitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mx-auto mb-3">
                <BadgeCheck className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-white font-semibold">Review Submitted!</p>
              <p className="text-sm text-zinc-400 mt-1">Thank you for your feedback.</p>
              <button
                onClick={() => setReviewSubmitted(false)}
                className="mt-4 text-xs text-purple-400 hover:text-purple-300 underline"
              >
                Write another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star picker */}
              <div>
                <p className="text-xs text-zinc-400 mb-2">Your Rating <span className="text-red-400">*</span></p>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      onMouseEnter={() => setReviewHover(s)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          s <= (reviewHover || reviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-600 hover:text-amber-400/60'
                        }`}
                      />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <span className="ml-2 text-sm text-amber-400 font-medium">
                      {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Your Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={80}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 transition-colors"
                />
              </div>

              {/* Review body */}
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Your Review <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Share your experience with this plan..."
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500/60 transition-colors resize-none"
                />
                <p className="text-[10px] text-zinc-600 mt-1 text-right">{reviewBody.length}/1000</p>
              </div>

              {!user && (
                <p className="text-xs text-zinc-500 bg-white/5 rounded-lg px-3 py-2">
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 underline">Login</Link> to get a verified badge on your review.
                </p>
              )}

              <button
                type="submit"
                disabled={reviewSubmitting || reviewRating === 0}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
              >
                {reviewSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                ) : (
                  <><Star className="w-4 h-4" />Submit Review</>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Related Plans */}
        {relatedPlans.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white mb-4">More Like This</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {relatedPlans.slice(0, 5).map((p) => {
                const v = p.price_variants[0]
                if (!v) return null
                const relLogo = getPlanLogo(p.name, p.image_url)
                const relIsBuiltin = relLogo?.startsWith('/logos/')
                const relBg = relIsBuiltin ? getPlanCardBg(p.name) : '#111113'
                return (
                  <Link key={p.id} href={`/product/${p.id}`} className="glass glass-hover rounded-xl overflow-hidden group">
                    <div className="card-img-area h-28 overflow-hidden relative" style={{ background: relBg }}>
                      {relLogo ? (
                        <img src={relLogo} alt={p.name} className={`absolute inset-0 w-full h-full ${relIsBuiltin ? 'object-contain p-4' : 'object-cover'}`}
                          onError={(e) => { const t = e.target as HTMLImageElement; t.style.display='none'; (t.nextElementSibling as HTMLElement)?.classList.remove('hidden') }} />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center ${relLogo ? 'hidden' : ''}`}>
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-black text-white">{p.name[0]}</div>
                      </div>
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">{p.name}</p>
                      <p className="text-sm font-bold text-white mt-1">₹{v.price}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <FloatingButtons />
    </div>
  )
}

'use client'
import { motion } from 'framer-motion'
import { Star, BadgeCheck } from 'lucide-react'
import type { Review } from '@/types'

const MOCK_REVIEWS: Review[] = [
  { id: '1', name: 'Rahul Sharma', rating: 5, body: 'Super fast delivery! Got my Netflix credentials within minutes. Totally genuine and works perfectly. 100% recommended!', verified: true, active: true, created_at: new Date().toISOString() },
  { id: '2', name: 'Priya Mehta', rating: 5, body: 'Been using StreamZone for 6 months now. Always on time, never any issues. Best price for OTT subscriptions in India!', verified: true, active: true, created_at: new Date().toISOString() },
  { id: '3', name: 'Amit Kumar', rating: 5, body: 'Ordered Netflix + Prime combo. Got both accounts instantly. Great service, will order again!', verified: true, active: true, created_at: new Date().toISOString() },
  { id: '4', name: 'Sneha Joshi', rating: 4, body: 'Good service and cheap prices. WhatsApp support is very responsive. Got Hotstar in under 2 hours.', verified: true, active: true, created_at: new Date().toISOString() },
  { id: '5', name: 'Vikram Singh', rating: 5, body: 'Trust banaya StreamZone pe. 4K Netflix at just ₹149 — unbelievable! Always buy from here now.', verified: true, active: true, created_at: new Date().toISOString() },
  { id: '6', name: 'Divya Patel', rating: 5, body: 'Excellent platform! Wallet cashback system is awesome. Referral bonus credited immediately. Love it!', verified: true, active: true, created_at: new Date().toISOString() },
]

interface ReviewsSectionProps {
  reviews?: Review[]
}

export default function ReviewsSection({ reviews = MOCK_REVIEWS }: ReviewsSectionProps) {
  const displayReviews = reviews.length > 0 ? reviews : MOCK_REVIEWS
  const avgRating = displayReviews.reduce((s, r) => s + r.rating, 0) / displayReviews.length

  return (
    <section className="mt-16">
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Customer Reviews</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                />
              ))}
            </div>
            <span className="text-lg font-bold text-white">{avgRating.toFixed(1)}</span>
            <span className="text-zinc-500 text-sm">({displayReviews.length}+ reviews)</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayReviews.slice(0, 6).map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="glass rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                  {review.name[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-white">{review.name}</p>
                    {review.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{review.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

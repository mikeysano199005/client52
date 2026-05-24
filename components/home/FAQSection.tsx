'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

const FAQS = [
  {
    q: 'How fast will I receive my subscription after payment?',
    a: 'Most orders are delivered within 1-3 hours after payment verification. During peak hours, it may take up to 6 hours. Premium plans with auto-delivery are instant.',
  },
  {
    q: 'Are these subscriptions genuine and safe to use?',
    a: 'Yes, all subscriptions we sell are 100% genuine. We provide shared or private accounts depending on the plan. We have been in this business for 3+ years with 10,000+ happy customers.',
  },
  {
    q: 'How do I pay? Is it safe?',
    a: 'We accept UPI (PhonePe, GPay, Paytm), NEFT, and IMPS. Simply place your order, make the payment, upload the screenshot, and we will process your order. No card details required.',
  },
  {
    q: 'What if my subscription stops working?',
    a: 'We offer full support. If your subscription stops working during the validity period, we will replace the account for free within 24 hours. Contact us on WhatsApp or Telegram.',
  },
  {
    q: 'Can I upgrade my plan later?',
    a: 'Yes! You can upgrade anytime. Contact our support team and we will adjust the pricing based on your remaining balance.',
  },
  {
    q: 'What is the Wallet and Referral system?',
    a: 'Your wallet stores balance that you can use for faster purchases. When you refer a friend and they make their first purchase, you both get ₹20 wallet credit automatically!',
  },
  {
    q: 'Do you offer combo packs?',
    a: 'Yes! We offer bundle combos like Netflix + Amazon Prime + Hotstar at heavily discounted prices. Check our Combos category for the best deals.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="mt-16 max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h2>
        <p className="text-zinc-500 text-sm">Everything you need to know</p>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="glass rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-medium text-white pr-4">{faq.q}</span>
              <div className="shrink-0 w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center">
                {open === i ? (
                  <Minus className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="px-5 pb-4 text-sm text-zinc-400 leading-relaxed border-t border-white/10 pt-3">
                    {faq.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

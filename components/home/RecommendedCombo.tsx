'use client'
import { useEffect, useState } from 'react'
import { Sparkles, ShoppingCart, X } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { getPlanLogo, getPlanCardBg } from '@/lib/logos'
import type { Plan, PlanVariant } from '@/types'
import toast from 'react-hot-toast'

// Combo map: plan name (lowercase keywords) → 2 recommended plan name keywords
const COMBO_MAP: Record<string, [string, string]> = {
  netflix:        ['prime', 'spotify'],
  prime:          ['netflix', 'hotstar'],
  amazon:         ['netflix', 'hotstar'],
  hotstar:        ['zee5', 'sonyliv'],
  'jio hotstar':  ['zee5', 'sonyliv'],
  spotify:        ['youtube', 'prime'],
  youtube:        ['spotify', 'netflix'],
  zee5:           ['sonyliv', 'hotstar'],
  sonyliv:        ['zee5', 'hotstar'],
  sony:           ['zee5', 'hotstar'],
  jiocinema:      ['hotstar', 'netflix'],
  'mx player':    ['hotstar', 'prime'],
}

// Guest default combo keywords
const GUEST_COMBO: [string, string, string] = ['netflix', 'prime', 'hotstar']

function matchPlan(plans: Plan[], keyword: string): Plan | null {
  return plans.find(p => p.name.toLowerCase().includes(keyword.toLowerCase())) || null
}

function findVariant(plan: Plan, label: string | null): PlanVariant | null {
  if (!plan.price_variants.length) return null
  if (!label) return plan.price_variants[0]
  // Try exact match first
  const exact = plan.price_variants.find(v => v.label.toLowerCase() === label.toLowerCase())
  if (exact) return exact
  // Try partial match (e.g. "3 Months" matches "3 Month")
  const partial = plan.price_variants.find(v =>
    v.label.toLowerCase().includes(label.split(' ')[0].toLowerCase())
  )
  return partial || plan.price_variants[0]
}

interface ComboItem {
  plan: Plan
  variant: PlanVariant
}

interface Props {
  plans: Plan[]
}

export default function RecommendedCombo({ plans }: Props) {
  const { addItem } = useCartStore()
  const [combo, setCombo] = useState<ComboItem[]>([])
  const [lastPlanName, setLastPlanName] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(({ lastPlan, lastVariantLabel }: { lastPlan: string | null; lastVariantLabel: string | null }) => {
        let comboPlans: (Plan | null)[] = []
        let variantLabel = lastVariantLabel

        if (!lastPlan) {
          // Guest: show popular combo
          setIsGuest(true)
          comboPlans = GUEST_COMBO.map(kw => matchPlan(plans, kw))
          variantLabel = null
        } else {
          setLastPlanName(lastPlan)
          // Find combo keywords for this plan
          const key = Object.keys(COMBO_MAP).find(k =>
            lastPlan.toLowerCase().includes(k.toLowerCase())
          )
          const comboKeys = key ? COMBO_MAP[key] : ['prime', 'hotstar']

          // Include the last bought plan + 2 recommended
          const lastBoughtPlan = matchPlan(plans, lastPlan)
          const rec1 = matchPlan(plans, comboKeys[0])
          const rec2 = matchPlan(plans, comboKeys[1])
          comboPlans = [lastBoughtPlan, rec1, rec2]
        }

        // Build combo items with variants
        const items: ComboItem[] = comboPlans
          .filter((p): p is Plan => p !== null)
          .map(plan => {
            const variant = findVariant(plan, variantLabel)
            return variant ? { plan, variant } : null
          })
          .filter((item): item is ComboItem => item !== null)
          .slice(0, 3)

        if (items.length >= 2) setCombo(items)
      })
      .catch(() => {})
  }, [plans])

  if (dismissed || combo.length < 2) return null

  const totalOriginal = combo.reduce((sum, c) => sum + c.variant.original_price, 0)
  const totalOur = combo.reduce((sum, c) => sum + c.variant.price, 0)
  const saved = totalOriginal - totalOur

  function handleAddAll() {
    combo.forEach(c => addItem(c.plan, c.variant))
    toast.success(`${combo.length} plans added to cart! 🛒`)
  }

  return (
    <div className="relative mt-8 mb-2 rounded-2xl border border-purple-500/25 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.05) 100%)' }}
    >
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 text-zinc-600 hover:text-zinc-400 transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            {isGuest ? 'Most Popular Combo' : 'Recommended For You'}
          </span>
        </div>
        <p className="text-sm text-zinc-400 mb-4">
          {isGuest
            ? 'Our customers love this combination:'
            : `You bought ${lastPlanName} before. Best combo for you:`
          }
        </p>

        {/* Plans row */}
        <div className="flex items-center gap-2 flex-wrap mb-5">
          {combo.map((item, i) => {
            const logo = getPlanLogo(item.plan.name)
            const bg = getPlanCardBg(item.plan.name)
            return (
              <div key={item.plan.id} className="flex items-center gap-2">
                {i > 0 && <span className="text-zinc-600 font-bold text-lg">+</span>}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden p-1"
                    style={{ background: bg }}
                  >
                    {logo
                      ? <img src={logo} alt={item.plan.name} className="w-full h-full object-contain" />
                      : <span className="text-xs font-black text-white">{item.plan.name[0]}</span>
                    }
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">{item.plan.name}</p>
                    <p className="text-[10px] text-zinc-500">{item.variant.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pricing + CTA */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Original</p>
              <p className="text-sm text-zinc-500 line-through">{formatPrice(totalOriginal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">You Pay</p>
              <p className="text-xl font-bold text-white">{formatPrice(totalOur)}</p>
            </div>
            <div className="px-2.5 py-1 bg-green-500/15 border border-green-500/25 rounded-lg">
              <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Save</p>
              <p className="text-sm font-bold text-green-400">{formatPrice(saved)}</p>
            </div>
          </div>

          <button
            onClick={handleAddAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all glow-purple-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            Add All to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

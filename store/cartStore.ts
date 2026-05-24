'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Plan, PlanVariant } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (plan: Plan, variant: PlanVariant) => void
  removeItem: (planId: string, variantLabel: string) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (plan, variant) => {
        const existing = get().items.find(
          (i) => i.plan.id === plan.id && i.variant.label === variant.label
        )
        if (existing) return
        set((state) => ({ items: [...state.items, { plan, variant, quantity: 1 }] }))
      },
      removeItem: (planId, variantLabel) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.plan.id === planId && i.variant.label === variantLabel)
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0),
      count: () => get().items.length,
    }),
    { name: 'sz-cart' }
  )
)

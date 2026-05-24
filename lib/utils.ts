import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, symbol = '₹') {
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SZ${timestamp}${random}`
}

export function generateReferralCode(name: string) {
  const base = name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4) || 'USER'
  const num = Math.floor(Math.random() * 9000) + 1000
  return `${base}${num}`
}

export function getDiscount(original: number, price: number) {
  return Math.round(((original - price) / original) * 100)
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  payment_submitted: 'Payment Submitted',
  under_verification: 'Under Verification',
  processing: 'Processing',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  payment_submitted: 'text-yellow-400 bg-yellow-400/10',
  under_verification: 'text-blue-400 bg-blue-400/10',
  processing: 'text-purple-400 bg-purple-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
}

export const CATEGORIES = ['OTT', 'Combos', 'Games', 'VPN', 'Utilities', 'Premium', 'Digital Keys']

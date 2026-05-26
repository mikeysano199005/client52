export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin' | 'owner'
  wallet_balance: number
  referral_code: string
  referred_by?: string
  phone?: string
  active: boolean
  created_at: string
}

export interface PlanVariant {
  label: string
  months: number
  price: number
  original_price: number
  quality: string
  access: string
}

export interface Plan {
  id: string
  name: string
  category: string
  description?: string
  image_url?: string
  badge?: string
  price_variants: PlanVariant[]
  stock_count: number
  rating: number
  review_count: number
  active: boolean
  featured: boolean
  sort_order: number
  countdown_ends_at?: string | null
  created_at: string
}

export interface AccountStock {
  id: string
  plan_id: string
  variant_label?: string
  email: string
  password: string
  profile_number?: string
  extra_info?: string
  status: 'available' | 'reserved' | 'used'
  order_id?: string
  added_at: string
  used_at?: string
}

export type OrderStatus = 'payment_submitted' | 'under_verification' | 'processing' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  order_number: string
  user_id: string
  plan_id: string
  plan_name: string
  plan_variant: PlanVariant
  account_id?: string
  status: OrderStatus
  amount: number
  coupon_code?: string
  discount_amount: number
  payment_method: string
  payment_proof_url?: string
  payment_utr?: string
  wallet_used: number
  notes?: string
  admin_notes?: string
  refund_requested?: boolean
  replacement_requested?: boolean
  created_at: string
  updated_at: string
  user?: User
  plan?: Plan
}

export interface WalletTransaction {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  amount: number
  reason: string
  reference_id?: string
  created_at: string
}

export interface Coupon {
  id: string
  code: string
  discount_type: 'flat' | 'percent'
  discount_value: number
  min_order_amount: number
  usage_limit: number
  used_count: number
  first_order_only: boolean
  expiry_at?: string
  active: boolean
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  reward_amount: number
  status: 'pending' | 'credited'
  order_id?: string
  created_at: string
}

export interface Review {
  id: string
  user_id?: string
  plan_id?: string
  name: string
  rating: number
  body: string
  image_url?: string
  verified: boolean
  active: boolean
  admin_reply?: string
  created_at: string
}

export interface Banner {
  id: string
  title?: string
  subtitle?: string
  image_url?: string
  link?: string
  button_text: string
  active: boolean
  sort_order: number
  created_at: string
}

export interface CartItem {
  plan: Plan
  variant: PlanVariant
  quantity: number
}

export interface SiteSettings {
  site_name: string
  site_tagline: string
  whatsapp_number: string
  telegram_username: string
  upi_id: string
  upi_name: string
  referral_reward: string
  currency_symbol: string
}

export interface WalletTopup {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  payment_proof_url?: string
  payment_utr?: string
  admin_notes?: string
  created_at: string
  updated_at: string
  user?: User
}

export interface AdminAnalytics {
  total_orders: number
  total_revenue: number
  total_users: number
  pending_orders: number
  delivered_orders: number
  today_orders: number
  today_revenue: number
}

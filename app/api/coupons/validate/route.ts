import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const { code, amount } = await req.json()

    if (!code) return Response.json({ error: 'Coupon code required' }, { status: 400 })

    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (!coupon) return Response.json({ error: 'Invalid coupon code' }, { status: 400 })
    if (coupon.expiry_at && new Date(coupon.expiry_at) < new Date()) {
      return Response.json({ error: 'Coupon has expired' }, { status: 400 })
    }
    if (coupon.used_count >= coupon.usage_limit) {
      return Response.json({ error: 'Coupon usage limit reached' }, { status: 400 })
    }
    if (amount < coupon.min_order_amount) {
      return Response.json({ error: `Minimum order amount is ₹${coupon.min_order_amount}` }, { status: 400 })
    }

    if (coupon.first_order_only) {
      const { count } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'delivered')
      if ((count || 0) > 0) {
        return Response.json({ error: 'This coupon is for first-time orders only' }, { status: 400 })
      }
    }

    const discount =
      coupon.discount_type === 'percent'
        ? Math.min(Math.round((amount * coupon.discount_value) / 100), amount)
        : Math.min(coupon.discount_value, amount)

    return Response.json({ discount, coupon })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

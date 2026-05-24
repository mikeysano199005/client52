import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data } = await supabaseAdmin.from('coupons').select('*').order('created_at', { ascending: false })
    return Response.json({ coupons: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: body.code.toUpperCase(),
        discount_type: body.discount_type,
        discount_value: Number(body.discount_value),
        min_order_amount: Number(body.min_order_amount) || 0,
        usage_limit: Number(body.usage_limit) || 1,
        first_order_only: body.first_order_only || false,
        expiry_at: body.expiry_at || null,
        active: true,
      })
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ coupon: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getSession()
    if (!user) return Response.json({ lastPlan: null, lastVariantLabel: null })

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('plan_name, plan_variant, status')
      .eq('user_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!order) return Response.json({ lastPlan: null, lastVariantLabel: null })

    const variantLabel = (order.plan_variant as { label?: string })?.label || null

    return Response.json({ lastPlan: order.plan_name, lastVariantLabel: variantLabel })
  } catch {
    return Response.json({ lastPlan: null, lastVariantLabel: null })
  }
}

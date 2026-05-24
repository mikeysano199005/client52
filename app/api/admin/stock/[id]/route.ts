import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { status } = await req.json()

    const allowed = ['available', 'used', 'expired', 'reserved']
    if (!allowed.includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('account_stock')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // If marking available again, update plan stock count
    if (status === 'available' && data?.plan_id) {
      const { count } = await supabaseAdmin
        .from('account_stock')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', data.plan_id)
        .eq('status', 'available')
      await supabaseAdmin
        .from('plans')
        .update({ stock_count: count || 0 })
        .eq('id', data.plan_id)
    }

    return Response.json({ stock: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

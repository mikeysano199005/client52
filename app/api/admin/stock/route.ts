import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const url = new URL(req.url)
    const planId = url.searchParams.get('plan_id')
    let query = supabaseAdmin.from('account_stock').select('*, plans(name)').order('added_at', { ascending: false })
    if (planId) query = query.eq('plan_id', planId)
    const { data } = await query
    return Response.json({ stock: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()

    // Bulk insert
    const items = Array.isArray(body) ? body : [body]
    const { data, error } = await supabaseAdmin
      .from('account_stock')
      .insert(items.map((item) => ({
        plan_id: item.plan_id,
        variant_label: item.variant_label || null,
        email: item.email,
        password: item.password,
        profile_number: item.profile_number || null,
        extra_info: item.extra_info || null,
        status: 'available',
      })))
      .select()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Update plan stock count
    if (items[0]?.plan_id) {
      const { count } = await supabaseAdmin
        .from('account_stock')
        .select('id', { count: 'exact', head: true })
        .eq('plan_id', items[0].plan_id)
        .eq('status', 'available')
      await supabaseAdmin.from('plans').update({ stock_count: count || 0 }).eq('id', items[0].plan_id)
    }

    return Response.json({ stock: data, added: data?.length })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdmin()
    const { id } = await req.json()
    const { error } = await supabaseAdmin.from('account_stock').delete().eq('id', id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const PAGE_SIZE = 50

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const url    = new URL(req.url)
    const page   = Math.max(1, Number(url.searchParams.get('page')   || 1))
    const planId = url.searchParams.get('plan_id')
    const status = url.searchParams.get('status')
    const offset = (page - 1) * PAGE_SIZE

    let query = supabaseAdmin
      .from('account_stock')
      .select('*, plans(name)', { count: 'exact' })
      .order('added_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (planId) query = query.eq('plan_id', planId)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, count, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Global stats (unfiltered) for the summary cards
    const [{ count: availableCount }, { count: usedCount }, { count: totalCount }] = await Promise.all([
      supabaseAdmin.from('account_stock').select('id', { count: 'exact', head: true }).eq('status', 'available'),
      supabaseAdmin.from('account_stock').select('id', { count: 'exact', head: true }).eq('status', 'used'),
      supabaseAdmin.from('account_stock').select('id', { count: 'exact', head: true }),
    ])

    return Response.json({
      stock:   data || [],
      total:   count ?? 0,
      page,
      hasMore: offset + PAGE_SIZE < (count ?? 0),
      stats: {
        available: availableCount ?? 0,
        used:      usedCount      ?? 0,
        total:     totalCount     ?? 0,
      },
    })
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
        plan_id:        item.plan_id,
        variant_label:  item.variant_label || null,
        email:          item.email,
        password:       item.password,
        profile_number: item.profile_number || null,
        extra_info:     item.extra_info || null,
        status:         'available',
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

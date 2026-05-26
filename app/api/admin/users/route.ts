import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

const PAGE_SIZE = 50

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const url = new URL(req.url)
    const page   = Math.max(1, Number(url.searchParams.get('page')   || 1))
    const search = url.searchParams.get('search') || ''
    const offset = (page - 1) * PAGE_SIZE

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, wallet_balance, referral_code, phone, active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

    const { data, count, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json({
      users:   data || [],
      total:   count ?? 0,
      page,
      hasMore: offset + PAGE_SIZE < (count ?? 0),
    })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

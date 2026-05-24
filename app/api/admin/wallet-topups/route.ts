import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const query = supabaseAdmin
      .from('wallet_topups')
      .select('*, user:users(id, name, email, wallet_balance)')
      .order('created_at', { ascending: false })

    if (status !== 'all') query.eq('status', status)

    const { data, error } = await query
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ topups: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

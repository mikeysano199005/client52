import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireAuth()
    const { data } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return Response.json({ transactions: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

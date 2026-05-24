import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, wallet_balance, referral_code, phone, active, created_at')
      .order('created_at', { ascending: false })
    return Response.json({ users: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

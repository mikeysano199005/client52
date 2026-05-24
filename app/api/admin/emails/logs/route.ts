import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(50)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json(data || [])
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*, users(name, email, phone)')
      .order('created_at', { ascending: false })
    return Response.json({ orders: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

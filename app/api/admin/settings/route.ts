import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data } = await supabaseAdmin.from('settings').select('key, value')
    const settings: Record<string, string> = {}
    for (const s of data || []) settings[s.key] = s.value
    return Response.json({ settings })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const updates = await req.json() as Record<string, string>
    for (const [key, value] of Object.entries(updates)) {
      await supabaseAdmin
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .eq('key', key)
    }
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin.from('settings').select('key, value')
  const settings: Record<string, string> = {}
  for (const s of data || []) settings[s.key] = s.value
  return Response.json({ settings })
}

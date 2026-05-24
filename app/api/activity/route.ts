import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 60 // cache 1 minute

export async function GET() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('plan_name, plan_variant, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  return Response.json(data || [])
}

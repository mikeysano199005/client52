import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [planRes, reviewsRes] = await Promise.all([
    supabaseAdmin.from('plans').select('*').eq('id', id).eq('active', true).single(),
    supabaseAdmin.from('reviews').select('*').eq('plan_id', id).eq('active', true).order('created_at', { ascending: false }).limit(10),
  ])

  if (!planRes.data) {
    return Response.json({ error: 'Plan not found' }, { status: 404 })
  }

  const { data: related } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('active', true)
    .eq('category', planRes.data.category)
    .neq('id', id)
    .limit(5)

  return Response.json({
    plan: planRes.data,
    reviews: reviewsRes.data || [],
    related: related || [],
  })
}

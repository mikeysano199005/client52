import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const { data, error } = await supabaseAdmin.from('plans').select('*').order('sort_order')
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ plans: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert({
        name: body.name,
        category: body.category,
        description: body.description,
        badge: body.badge || null,
        featured: body.featured ?? false,
        active: body.active ?? true,
        sort_order: body.sort_order ?? 0,
        price_variants: body.price_variants,
      })
      .select()
      .single()
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ plan: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

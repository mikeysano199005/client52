import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

function getPayload(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const expectedSig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (sig !== expectedSig) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { plan_id, rating, name, review_body } = body

  if (!plan_id || !rating || !name || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('sz_session')?.value
  let userId: string | null = null
  let verified = false

  if (token) {
    const payload = getPayload(token)
    if (payload && typeof payload.sub === 'string') {
      userId = payload.sub
      // FIX: check plan_id directly on orders (no "items" array column)
      const { count } = await supabaseAdmin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('plan_id', plan_id)
        .eq('status', 'delivered')
      verified = (count ?? 0) > 0
    }
  }

  const { error } = await supabaseAdmin.from('reviews').insert({
    plan_id,
    user_id: userId,
    name: name.trim().slice(0, 80),
    rating,
    body: (review_body || '').trim().slice(0, 1000),
    verified,
    active: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update plan rating average
  const { data: allReviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('plan_id', plan_id)
    .eq('active', true)

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await supabaseAdmin
      .from('plans')
      .update({ rating: Math.round(avg * 10) / 10, review_count: allReviews.length })
      .eq('id', plan_id)
  }

  return NextResponse.json({ ok: true })
}

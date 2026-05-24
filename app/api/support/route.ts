import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET  /api/support  — list user's conversations with last message
export async function GET() {
  try {
    const user = await requireAuth()
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        id, subject, status, created_at, updated_at,
        support_messages ( id, sender_type, message, is_read, created_at )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST /api/support  — start a new conversation + first message
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { subject, message } = await req.json()
    if (!subject?.trim() || !message?.trim())
      return NextResponse.json({ error: 'Subject and message required' }, { status: 400 })

    const { data: ticket, error: te } = await supabaseAdmin
      .from('support_tickets')
      .insert({ user_id: user.id, subject: subject.trim(), status: 'open' })
      .select()
      .single()
    if (te) return NextResponse.json({ error: te.message }, { status: 500 })

    const { error: me } = await supabaseAdmin
      .from('support_messages')
      .insert({ ticket_id: ticket.id, sender_type: 'user', message: message.trim() })
    if (me) return NextResponse.json({ error: me.message }, { status: 500 })

    return NextResponse.json({ ticket })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

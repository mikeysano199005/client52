import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/support/[id]/messages  — user sends a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const { message } = await req.json()
    if (!message?.trim())
      return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // Verify ticket belongs to user
    const { data: ticket } = await supabaseAdmin
      .from('support_tickets')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (ticket.status === 'closed')
      return NextResponse.json({ error: 'Ticket is closed' }, { status: 400 })

    const { data: msg, error: me } = await supabaseAdmin
      .from('support_messages')
      .insert({ ticket_id: id, sender_type: 'user', message: message.trim() })
      .select()
      .single()
    if (me) return NextResponse.json({ error: me.message }, { status: 500 })

    // Bump updated_at so admin list sorts correctly
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'open', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

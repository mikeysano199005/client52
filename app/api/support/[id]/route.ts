import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/support/[id]  — full ticket + all messages
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth()
    const { id } = await params

    const { data: ticket, error: te } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (te || !ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { data: messages } = await supabaseAdmin
      .from('support_messages')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    // Mark admin messages as read
    await supabaseAdmin
      .from('support_messages')
      .update({ is_read: true })
      .eq('ticket_id', id)
      .eq('sender_type', 'admin')
      .eq('is_read', false)

    return NextResponse.json({ ticket, messages: messages ?? [] })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/admin/support/[id]/messages  — admin sends a message
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { message } = await req.json()
    if (!message?.trim())
      return NextResponse.json({ error: 'Message required' }, { status: 400 })

    const { data: msg, error: me } = await supabaseAdmin
      .from('support_messages')
      .insert({ ticket_id: id, sender_type: 'admin', message: message.trim() })
      .select()
      .single()
    if (me) return NextResponse.json({ error: me.message }, { status: 500 })

    // Bump ticket to replied
    await supabaseAdmin
      .from('support_tickets')
      .update({ status: 'replied', updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ message: msg })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

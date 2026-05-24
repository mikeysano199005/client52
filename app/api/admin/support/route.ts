import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/admin/support  — all conversations with last message + unread count
export async function GET() {
  try {
    await requireAdmin()
    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        id, subject, status, created_at, updated_at,
        user:users ( id, name, email ),
        support_messages ( id, sender_type, message, is_read, created_at )
      `)
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json([], { status: 200 })
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

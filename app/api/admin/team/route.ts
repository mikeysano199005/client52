import { supabaseAdmin } from '@/lib/supabase'
import { requireOwner } from '@/lib/auth'

// GET — list all admins
export async function GET() {
  try {
    await requireOwner()
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, created_at, active')
      .in('role', ['admin', 'owner'])
      .order('created_at')
    return Response.json(data || [])
  } catch {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// POST — add admin by email
export async function POST(req: Request) {
  try {
    await requireOwner()
    const { email } = await req.json() as { email?: string }
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) return Response.json({ error: 'User not found. They must sign up first.' }, { status: 404 })
    if (user.role === 'owner') return Response.json({ error: 'Cannot modify owner.' }, { status: 400 })
    if (user.role === 'admin') return Response.json({ error: 'User is already an admin.' }, { status: 400 })

    await supabaseAdmin.from('users').update({ role: 'admin' }).eq('id', user.id)
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
}

// DELETE — remove admin by id
export async function DELETE(req: Request) {
  try {
    await requireOwner()
    const { id } = await req.json() as { id?: string }
    if (!id) return Response.json({ error: 'ID required' }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single()

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })
    if (user.role === 'owner') return Response.json({ error: 'Cannot remove the owner.' }, { status: 400 })

    await supabaseAdmin.from('users').update({ role: 'user' }).eq('id', id)
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }
}

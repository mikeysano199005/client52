import { compare } from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, password_hash, role, active, wallet_balance')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.active) {
      return Response.json({ error: 'Account is disabled. Contact support.' }, { status: 403 })
    }

    const valid = await compare(password, user.password_hash)
    if (!valid) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const jwt = await createSession(user.id)
    await setSessionCookie(jwt)

    return Response.json({
      success: true,
      user: { name: user.name, email: user.email, role: user.role },
      redirectTo: user.role === 'admin' ? '/admin' : '/dashboard',
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

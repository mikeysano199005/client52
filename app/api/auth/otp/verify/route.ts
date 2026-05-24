import { supabaseAdmin } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json() as { email?: string; code?: string }

    if (!email || !code) {
      return Response.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedCode = code.trim()

    // Find valid OTP
    const { data: otp } = await supabaseAdmin
      .from('otp_codes')
      .select('id, code, expires_at, used')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otp) {
      return Response.json({ error: 'No valid code found. Please request a new one.' }, { status: 400 })
    }

    if (new Date(otp.expires_at) < new Date()) {
      return Response.json({ error: 'Code has expired. Please request a new one.' }, { status: 400 })
    }

    if (otp.code !== normalizedCode) {
      return Response.json({ error: 'Incorrect code. Please try again.' }, { status: 400 })
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otp.id)

    // Find or create user by email
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, active, wallet_balance')
      .eq('email', normalizedEmail)
      .single()

    if (!user) {
      // Auto-create account — OTP proves they own the email
      const name = normalizedEmail.split('@')[0]
      const { data: newUser } = await supabaseAdmin
        .from('users')
        .insert({
          name,
          email: normalizedEmail,
          password_hash: `OTP:${Date.now()}`, // placeholder
          role: 'user',
          active: true,
          wallet_balance: 0,
        })
        .select('id, name, email, role, active, wallet_balance')
        .single()

      if (!newUser) {
        return Response.json({ error: 'Failed to create account. Try again.' }, { status: 500 })
      }
      user = newUser
    }

    if (!user.active) {
      return Response.json({ error: 'Account is disabled. Contact support.' }, { status: 403 })
    }

    // Issue session (same as regular login)
    const jwt = await createSession(user.id)
    await setSessionCookie(jwt)

    return Response.json({
      success: true,
      redirectTo: user.role === 'admin' ? '/admin' : '/dashboard',
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

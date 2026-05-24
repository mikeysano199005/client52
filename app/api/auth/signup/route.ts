import { hash } from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/auth'
import { generateReferralCode } from '@/lib/utils'
import { sendWelcomeEmail } from '@/lib/email'
import { notifyNewUser } from '@/lib/telegram'

export async function POST(req: Request) {
  try {
    const { name, email, password, referralCode } = await req.json()

    if (!name || !email || !password) {
      return Response.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 })
    }

    // Find referrer
    let referrerId: string | null = null
    if (referralCode) {
      const { data: referrer } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('referral_code', referralCode.toUpperCase())
        .single()
      if (referrer) referrerId = referrer.id
    }

    const passwordHash = await hash(password, 12)
    const myReferralCode = generateReferralCode(name)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        referral_code: myReferralCode,
        referred_by: referrerId,
      })
      .select('id, name, email, role')
      .single()

    if (error || !user) {
      return Response.json({ error: 'Failed to create account' }, { status: 500 })
    }

    // Track referral
    if (referrerId) {
      await supabaseAdmin.from('referrals').insert({
        referrer_id: referrerId,
        referred_id: user.id,
        reward_amount: 20,
        status: 'pending',
      })
    }

    const jwt = await createSession(user.id)
    await setSessionCookie(jwt)

    // Background tasks
    sendWelcomeEmail(user.email, user.name, myReferralCode).catch(() => null)
    notifyNewUser(user.name, user.email).catch(() => null)

    return Response.json({ success: true, user: { name: user.name, email: user.email } })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

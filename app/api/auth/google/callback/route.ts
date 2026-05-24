import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession, setSessionCookie } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return Response.redirect(`${origin}/login?error=google_cancelled`)
  }

  // Verify CSRF state
  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  cookieStore.delete('oauth_state')

  if (!state || state !== savedState) {
    return Response.redirect(`${origin}/login?error=invalid_state`)
  }

  if (!code) {
    return Response.redirect(`${origin}/login?error=no_code`)
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json() as { access_token?: string; error?: string }
    if (!tokenRes.ok || !tokens.access_token) {
      console.error('Google token exchange failed:', tokens)
      return Response.redirect(`${origin}/login?error=token_exchange`)
    }

    // 2. Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json() as { email?: string; name?: string; picture?: string }

    if (!profile.email) {
      return Response.redirect(`${origin}/login?error=no_email`)
    }

    const email = profile.email.toLowerCase().trim()
    const name = profile.name || email.split('@')[0]

    // 3. Find existing user or create new one
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('id, active, role')
      .eq('email', email)
      .single()

    if (!user) {
      // New user — create account (no password since Google handles auth)
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          name,
          email,
          password_hash: `GOOGLE:${randomHex()}`, // placeholder — never used for login
          role: 'user',
          active: true,
          wallet_balance: 0,
        })
        .select('id, active, role')
        .single()

      if (createError || !newUser) {
        console.error('Failed to create Google user:', createError)
        return Response.redirect(`${origin}/login?error=create_failed`)
      }
      user = newUser
    }

    if (!user.active) {
      return Response.redirect(`${origin}/login?error=account_disabled`)
    }

    // 4. Issue session cookie (same as regular login)
    const jwt = await createSession(user.id)
    await setSessionCookie(jwt)

    const redirectTo = user.role === 'admin' ? '/admin' : '/dashboard'
    return Response.redirect(`${origin}${redirectTo}`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return Response.redirect(`${origin}/login?error=oauth_failed`)
  }
}

function randomHex(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

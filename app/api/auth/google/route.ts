import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return Response.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  // CSRF state token — stored in cookie, verified in callback
  const state = randomBytes(16).toString('hex')
  const cookieStore = await cookies()
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  })

  const baseUrl = new URL(req.url).origin
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  })

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}

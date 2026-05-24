import { createHmac, randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { supabaseAdmin } from './supabase'
import type { User } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const SESSION_COOKIE = 'sz_session'
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function verifyToken(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return null
    const expectedSig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (sig !== expectedSig) return null
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await supabaseAdmin.from('sessions').insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  })

  const jwt = signToken({ token, exp: Math.floor(expiresAt.getTime() / 1000) })
  return jwt
}

export async function setSessionCookie(jwt: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const jwt = cookieStore.get(SESSION_COOKIE)?.value
    if (!jwt) return null

    const payload = verifyToken(jwt)
    if (!payload || typeof payload.token !== 'string') return null

    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token', payload.token)
      .single()

    if (!session) return null
    if (new Date(session.expires_at) < new Date()) return null

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, wallet_balance, referral_code, referred_by, phone, active, created_at')
      .eq('id', session.user_id)
      .single()

    if (!user || !user.active) return null
    return user as User
  } catch {
    return null
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getSession()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'admin' && user.role !== 'owner') throw new Error('Forbidden')
  return user
}

export async function requireOwner(): Promise<User> {
  const user = await requireAuth()
  if (user.role !== 'owner') throw new Error('Forbidden')
  return user
}

export async function logoutAllSessions(userId: string): Promise<void> {
  await supabaseAdmin.from('sessions').delete().eq('user_id', userId)
}

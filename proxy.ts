import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

function isValidSession(token: string | undefined): boolean {
  if (!token) return false
  try {
    const [header, body, sig] = token.split('.')
    if (!header || !body || !sig) return false
    const expectedSig = createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url')
    if (sig !== expectedSig) return false
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Record<string, unknown>
    if (typeof payload.exp === 'number' && payload.exp < Date.now() / 1000) return false
    return true
  } catch {
    return false
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const sessionToken = req.cookies.get('sz_session')?.value
  const hasValidSession = isValidSession(sessionToken)

  // Protect dashboard and checkout routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/checkout')) {
    if (!hasValidSession) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!hasValidSession) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect already-logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && hasValidSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/checkout/:path*', '/login', '/signup'],
}

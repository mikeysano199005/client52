import { requireAuth, logoutAllSessions, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const user = await requireAuth()
    await logoutAllSessions(user.id)
    await clearSessionCookie()
    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

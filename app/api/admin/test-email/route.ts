import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'

    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not set in environment variables' }, { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: 'lakshitsharma4748@gmail.com',
        subject: 'DIGITAL OTT — Email Test',
        html: '<p>Email system is working! ✅</p>',
      }),
    })

    const data = await res.json()
    return NextResponse.json({
      status: res.status,
      resend_response: data,
      env_key_set: true,
      env_key_prefix: apiKey.slice(0, 8) + '...',
      from_address: from,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

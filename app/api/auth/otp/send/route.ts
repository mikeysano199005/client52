import { supabaseAdmin } from '@/lib/supabase'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOTPEmail(email: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'noreply@digitalott.in',
      to: email,
      subject: `${code} — Your DIGITAL OTT login code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:40px 32px;border-radius:16px">
          <h2 style="color:#8b5cf6;margin:0 0 8px">DIGITAL OTT</h2>
          <p style="color:#a1a1aa;margin:0 0 32px;font-size:14px">Your one-time login code</p>

          <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;letter-spacing:2px;text-transform:uppercase">Verification Code</p>
            <p style="margin:0;font-size:40px;font-weight:900;letter-spacing:10px;color:#ffffff">${code}</p>
          </div>

          <p style="color:#a1a1aa;font-size:13px;margin:0 0 8px">⏱ This code expires in <strong style="color:#f4f4f5">10 minutes</strong>.</p>
          <p style="color:#a1a1aa;font-size:13px;margin:0">🔒 If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }),
  }).catch(() => null)
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json() as { email?: string }

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit: max 3 OTPs per email in last 10 minutes
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', normalizedEmail)
      .gte('created_at', tenMinAgo)

    if ((count ?? 0) >= 3) {
      return Response.json({ error: 'Too many attempts. Please wait a few minutes.' }, { status: 429 })
    }

    // Invalidate any previous unused codes for this email
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('email', normalizedEmail)
      .eq('used', false)

    // Generate and store new OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseAdmin
      .from('otp_codes')
      .insert({ email: normalizedEmail, code, expires_at: expiresAt })

    if (insertError) {
      return Response.json({ error: 'Failed to generate code. Try again.' }, { status: 500 })
    }

    await sendOTPEmail(normalizedEmail, code)

    return Response.json({ success: true, message: 'Code sent to your email' })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

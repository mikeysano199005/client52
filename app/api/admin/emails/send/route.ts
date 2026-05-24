import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

const TEMPLATES: Record<string, (name: string, plan: string, variant: string, price: string, orderNum: string) => { subject: string; html: string }> = {
  renewal_reminder: (name, plan, variant, price, orderNum) => ({
    subject: `Your ${plan} subscription is expiring soon!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin:0 0 4px">DIGITAL OTT</h1>
        <h2>⏰ Time to Renew, ${name}!</h2>
        <p>Your <strong>${plan} ${variant}</strong> subscription is expiring soon. Don't miss out on your favourite content!</p>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong>Plan:</strong> ${plan} — ${variant}</p>
          <p style="margin:8px 0 0"><strong>Renewal Price:</strong> ₹${price}</p>
        </div>
        <p>Renew now and enjoy uninterrupted streaming at the best price.</p>
        <p style="color:#a1a1aa;font-size:14px">Order #${orderNum} | Contact us on WhatsApp or Telegram to renew.</p>
      </div>
    `,
  }),

  new_offer: (name, plan, variant, price, orderNum) => ({
    subject: `🔥 Special Offer Just for You, ${name}!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin:0 0 4px">DIGITAL OTT</h1>
        <h2>🔥 Exclusive Deal for You!</h2>
        <p>Hi ${name}, we have a special offer tailored just for you!</p>
        <div style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0;color:#fbbf24;font-size:18px;font-weight:700">Limited Time Offer 🎯</p>
          <p style="margin:8px 0 0">Based on your <strong>${plan} ${variant}</strong> subscription, we have something amazing lined up for you.</p>
        </div>
        <p>Hurry — this deal won't last long! Contact us now to claim your offer.</p>
        <p style="color:#a1a1aa;font-size:14px">Previous order: #${orderNum} | Reach us on WhatsApp or Telegram.</p>
      </div>
    `,
  }),

  thank_you: (name, plan, variant, price, orderNum) => ({
    subject: `Thank You for Choosing DIGITAL OTT, ${name}! 💜`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin:0 0 4px">DIGITAL OTT</h1>
        <h2>💜 Thank You, ${name}!</h2>
        <p>We truly appreciate your trust in DIGITAL OTT. Your satisfaction is our top priority!</p>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0">You've been enjoying: <strong>${plan} — ${variant}</strong></p>
          <p style="margin:8px 0 0;color:#a1a1aa;font-size:14px">Order #${orderNum}</p>
        </div>
        <p>Share your experience with friends and earn ₹20 wallet credit for every successful referral!</p>
        <p style="color:#a1a1aa;font-size:14px">Need anything? We're always here on WhatsApp or Telegram. 🙏</p>
      </div>
    `,
  }),

  custom: (name, plan, variant, price, orderNum) => ({
    subject: `Message from DIGITAL OTT`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin:0 0 4px">DIGITAL OTT</h1>
        <p>Hi ${name},</p>
        <p>Plan: ${plan} — ${variant} (₹${price}) | Order #${orderNum}</p>
      </div>
    `,
  }),
}

function fillTemplate(
  template: keyof typeof TEMPLATES | string,
  customSubject: string,
  customHtml: string,
  name: string,
  plan: string,
  variant: string,
  price: string,
  orderNum: string
): { subject: string; html: string } {
  if (template === 'custom') {
    const filled = (s: string) =>
      s.replace(/{name}/g, name)
       .replace(/{plan}/g, plan)
       .replace(/{variant}/g, variant)
       .replace(/{price}/g, price)
       .replace(/{order_number}/g, orderNum)
    return { subject: filled(customSubject), html: filled(customHtml) }
  }
  const fn = TEMPLATES[template]
  return fn ? fn(name, plan, variant, price, orderNum) : TEMPLATES.thank_you(name, plan, variant, price, orderNum)
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { template, customSubject, customHtml } = await req.json() as {
      template: string
      customSubject?: string
      customHtml?: string
    }

    if (!template) {
      return Response.json({ error: 'Template is required' }, { status: 400 })
    }

    // Fetch active buyers: users who have at least one delivered order
    const { data: buyers } = await supabaseAdmin
      .from('orders')
      .select('user_id, plan_name, plan_variant, amount, order_number, users(id, name, email, active)')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })

    if (!buyers || buyers.length === 0) {
      return Response.json({ error: 'No active buyers found' }, { status: 404 })
    }

    // De-duplicate by user_id — keep the most recent order per user
    const seenUsers = new Set<string>()
    const targets: Array<{
      userId: string
      name: string
      email: string
      plan: string
      variant: string
      price: string
      orderNum: string
    }> = []

    for (const row of buyers) {
      const u = (row.users as unknown) as { id: string; name: string; email: string; active: boolean } | null
      if (!u || !u.active || seenUsers.has(u.id)) continue
      seenUsers.add(u.id)
      const variant = (row.plan_variant as { label?: string })?.label || ''
      targets.push({
        userId: u.id,
        name: u.name,
        email: u.email,
        plan: row.plan_name,
        variant,
        price: String(row.amount),
        orderNum: row.order_number,
      })
    }

    if (targets.length === 0) {
      return Response.json({ error: 'No eligible recipients' }, { status: 404 })
    }

    // Send emails
    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const t of targets) {
      try {
        const { subject, html } = fillTemplate(
          template,
          customSubject || '',
          customHtml || '',
          t.name,
          t.plan,
          t.variant,
          t.price,
          t.orderNum
        )
        await sendEmail({ to: t.email, subject, html })
        sent++
      } catch {
        failed++
        errors.push(t.email)
      }
    }

    // Log to email_logs table
    await supabaseAdmin.from('email_logs').insert({
      template,
      recipients: targets.length,
      sent,
      failed,
      custom_subject: customSubject || null,
      sent_at: new Date().toISOString(),
    })

    return Response.json({ success: true, sent, failed, total: targets.length })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

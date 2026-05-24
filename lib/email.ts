import type { Order, AccountStock } from '@/types'

interface EmailPayload {
  to: string
  subject: string
  html: string
}

const BASE_STYLE = `font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px`
const HEADER = `<h1 style="color:#8b5cf6;margin:0 0 4px">DIGITAL OTT</h1>`

export async function sendEmail(payload: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  }).catch(() => null)
}

export async function sendOrderConfirmation(order: Order, userEmail: string, userName: string) {
  await sendEmail({
    to: userEmail,
    subject: `Order Confirmed - #${order.order_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin-bottom:8px">DIGITAL OTT</h1>
        <h2>Order Received! ✅</h2>
        <p>Hi ${userName}, your order has been received successfully.</p>
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>Order Number:</strong> #${order.order_number}</p>
          <p><strong>Plan:</strong> ${order.plan_name}</p>
          <p><strong>Amount:</strong> ₹${order.amount}</p>
          <p><strong>Status:</strong> Payment Submitted</p>
        </div>
        <p>We will verify your payment and deliver your subscription within a few hours. You will receive another email once your order is delivered.</p>
        <p style="color:#a1a1aa;font-size:14px">Need help? Contact us on WhatsApp or Telegram.</p>
      </div>
    `,
  })
}

export async function sendAccountDelivery(
  order: Order,
  account: AccountStock,
  userEmail: string,
  userName: string
) {
  await sendEmail({
    to: userEmail,
    subject: `Your Subscription is Ready - #${order.order_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin-bottom:8px">DIGITAL OTT</h1>
        <h2>Your Subscription is Ready! 🎉</h2>
        <p>Hi ${userName}, here are your account credentials:</p>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:20px;margin:16px 0">
          <h3 style="margin-top:0;color:#8b5cf6">${order.plan_name}</h3>
          <p><strong>Email:</strong> ${account.email}</p>
          <p><strong>Password:</strong> ${account.password}</p>
          ${account.profile_number ? `<p><strong>Profile Number:</strong> ${account.profile_number}</p>` : ''}
          ${account.extra_info ? `<p><strong>Additional Info:</strong> ${account.extra_info}</p>` : ''}
        </div>
        <div style="background:rgba(255,165,0,0.1);border-radius:8px;padding:12px;margin:16px 0">
          <p style="margin:0;color:#fbbf24">⚠️ Important: Do NOT change the email, password, or any account settings. Do NOT share credentials with others.</p>
        </div>
        <p style="color:#a1a1aa;font-size:14px">Order #${order.order_number} | Need help? Contact us on WhatsApp or Telegram.</p>
      </div>
    `,
  })
}

export async function sendPaymentVerified(order: Order, userEmail: string, userName: string) {
  await sendEmail({
    to: userEmail,
    subject: `Payment Verified - Order #${order.order_number} is Being Processed`,
    html: `
      <div style="${BASE_STYLE}">
        ${HEADER}
        <h2>Payment Verified! ✅</h2>
        <p>Hi ${userName}, great news! Your payment has been verified and your order is now being processed.</p>
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>Order Number:</strong> #${order.order_number}</p>
          <p><strong>Plan:</strong> ${order.plan_name}</p>
          <p><strong>Amount:</strong> ₹${order.amount}</p>
          <p><strong>Status:</strong> Processing 🔄</p>
        </div>
        <p>Your subscription credentials will be delivered shortly. We'll send you another email the moment it's ready!</p>
        <p style="color:#a1a1aa;font-size:14px">Need help? Contact us on WhatsApp or Telegram.</p>
      </div>
    `,
  })
}

export async function sendOrderCancelled(
  order: Order,
  userEmail: string,
  userName: string,
  adminNotes?: string
) {
  await sendEmail({
    to: userEmail,
    subject: `Order Cancelled - #${order.order_number}`,
    html: `
      <div style="${BASE_STYLE}">
        ${HEADER}
        <h2>Order Cancelled ❌</h2>
        <p>Hi ${userName}, unfortunately your order has been cancelled.</p>
        <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>Order Number:</strong> #${order.order_number}</p>
          <p><strong>Plan:</strong> ${order.plan_name}</p>
          <p><strong>Amount:</strong> ₹${order.amount}</p>
          ${adminNotes ? `<p><strong>Reason:</strong> ${adminNotes}</p>` : ''}
        </div>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:12px;margin:16px 0">
          <p style="margin:0;color:#c4b5fd">💜 If you paid, a refund will be credited to your wallet within 24 hours. You can use it for future purchases.</p>
        </div>
        <p style="color:#a1a1aa;font-size:14px">Questions? Contact us on WhatsApp or Telegram — we're here to help.</p>
      </div>
    `,
  })
}

export async function sendWelcomeEmail(userEmail: string, userName: string, referralCode: string) {
  await sendEmail({
    to: userEmail,
    subject: 'Welcome to DIGITAL OTT! 🎬',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#09090b;color:#f4f4f5;padding:32px;border-radius:12px">
        <h1 style="color:#8b5cf6;margin-bottom:8px">DIGITAL OTT</h1>
        <h2>Welcome, ${userName}! 🎉</h2>
        <p>Your account has been created successfully. You can now browse and buy premium OTT subscriptions at the best prices.</p>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:8px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong>Your Referral Code:</strong> <code style="color:#8b5cf6;font-size:18px">${referralCode}</code></p>
          <p style="margin:8px 0 0;color:#a1a1aa;font-size:14px">Share this code and earn ₹20 wallet credit for every friend who makes their first purchase!</p>
        </div>
        <p style="color:#a1a1aa;font-size:14px">Happy streaming! 🎬</p>
      </div>
    `,
  })
}

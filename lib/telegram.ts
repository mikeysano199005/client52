import type { Order } from '@/types'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

async function sendMessage(chatId: string, text: string) {
  if (!BOT_TOKEN || !chatId) return
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  }).catch(() => null)
}

export async function notifyNewOrder(order: Order, userName: string, userEmail: string) {
  if (!ADMIN_CHAT_ID) return
  const text = `🔥 <b>New Order!</b>

📦 Order: <code>#${order.order_number}</code>
👤 Customer: ${userName}
📧 Email: ${userEmail}
🛒 Plan: ${order.plan_name}
💰 Amount: ₹${order.amount}
📅 Date: ${new Date(order.created_at).toLocaleString('en-IN')}

⏳ Status: Payment Submitted
👉 Check admin panel to process`

  await sendMessage(ADMIN_CHAT_ID, text)
}

export async function notifyOrderStatusChange(order: Order, userName: string) {
  if (!ADMIN_CHAT_ID) return
  const statusLabels: Record<string, string> = {
    under_verification: '🔍 Under Verification',
    processing: '⚙️ Processing',
    delivered: '✅ Delivered',
    cancelled: '❌ Cancelled',
  }
  const text = `📋 <b>Order Status Updated</b>

📦 Order: <code>#${order.order_number}</code>
👤 Customer: ${userName}
🛒 Plan: ${order.plan_name}
📊 New Status: ${statusLabels[order.status] || order.status}`

  await sendMessage(ADMIN_CHAT_ID, text)
}

export async function notifyLowStock(planName: string, remaining: number) {
  if (!ADMIN_CHAT_ID) return
  const text = `⚠️ <b>Low Stock Alert!</b>

📦 Plan: ${planName}
📉 Remaining: ${remaining} accounts

Please upload more accounts soon!`

  await sendMessage(ADMIN_CHAT_ID, text)
}

export async function notifyNewUser(name: string, email: string) {
  if (!ADMIN_CHAT_ID) return
  const text = `👤 <b>New User Registered!</b>

Name: ${name}
Email: ${email}
Time: ${new Date().toLocaleString('en-IN')}`

  await sendMessage(ADMIN_CHAT_ID, text)
}

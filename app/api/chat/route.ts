import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You are a helpful customer support assistant for DIGITAL OTT, a premium OTT subscription selling website in India.

Key info:
- We sell Netflix, Amazon Prime, Jio Hotstar, YouTube Premium, Zee5, and combo packs
- Delivery: 1-6 hours after payment verification
- Payment: UPI (PhonePe, GPay, Paytm), NEFT, IMPS
- Prices start from ₹49/month
- If subscription stops working, we replace for free
- Contact: WhatsApp and Telegram support available
- Refund: No refunds after credentials delivered, but replacement guaranteed

Always be friendly, concise, and in 1-3 sentences. If you can't answer, suggest WhatsApp/Telegram contact.`

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return Response.json({ reply: 'Please send a valid message.' })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ reply: getLocalReply(message) })
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: SYSTEM,
      messages: [{ role: 'user', content: message }],
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Please contact us on WhatsApp for support.'
    return Response.json({ reply })
  } catch {
    return Response.json({ reply: getLocalReply('') })
  }
}

function getLocalReply(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('payment') || m.includes('pay') || m.includes('upi')) {
    return 'We accept UPI (PhonePe, GPay, Paytm), NEFT, and IMPS. After paying, upload your screenshot and we\'ll process your order!'
  }
  if (m.includes('delivery') || m.includes('fast') || m.includes('how long') || m.includes('time')) {
    return 'Most orders are delivered within 1-6 hours after payment verification. We work 24/7!'
  }
  if (m.includes('refund')) {
    return 'We don\'t offer refunds after credentials are delivered, but we guarantee free replacement if your subscription stops working!'
  }
  if (m.includes('order') || m.includes('buy') || m.includes('purchase')) {
    return 'To order: 1) Select a plan, 2) Checkout, 3) Pay via UPI, 4) Upload screenshot. Your credentials will be delivered within hours!'
  }
  if (m.includes('contact') || m.includes('support') || m.includes('help')) {
    return 'You can reach us on WhatsApp or Telegram for instant support. We\'re available 24/7!'
  }
  return 'I\'m here to help! For detailed queries, please contact us on WhatsApp or Telegram for instant support.'
}

import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'
import { generateOrderNumber } from '@/lib/utils'
import { sendOrderConfirmation } from '@/lib/email'
import { notifyNewOrder } from '@/lib/telegram'
import type { CartItem } from '@/types'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const formData = await req.formData()

    const items = JSON.parse(formData.get('items') as string) as CartItem[]
    const couponCode = formData.get('couponCode') as string
    const couponDiscount = Number(formData.get('couponDiscount') || 0)
    const useWallet = formData.get('useWallet') === 'true'
    const walletAmount = Number(formData.get('walletAmount') || 0)
    const amount = Number(formData.get('amount') || 0)
    const paymentUTR = formData.get('paymentUTR') as string
    const notes = formData.get('notes') as string
    const proofFile = formData.get('paymentProof') as File | null

    if (!items || items.length === 0) {
      return Response.json({ error: 'No items in order' }, { status: 400 })
    }

    // Upload payment proof
    let proofUrl: string | null = null
    if (proofFile && proofFile.size > 0) {
      const bytes = await proofFile.arrayBuffer()
      const filename = `proofs/${user.id}/${Date.now()}-${proofFile.name}`
      const { data: uploadData } = await supabaseAdmin.storage
        .from('payments')
        .upload(filename, bytes, { contentType: proofFile.type })
      if (uploadData) {
        const { data: urlData } = supabaseAdmin.storage.from('payments').getPublicUrl(filename)
        proofUrl = urlData.publicUrl
      }
    }

    // Create one order per cart item
    const createdOrders = []
    for (const item of items) {
      const orderNumber = generateOrderNumber()
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          plan_id: item.plan.id,
          plan_name: item.plan.name,
          plan_variant: item.variant,
          status: 'payment_submitted',
          amount: item.variant.price,
          coupon_code: couponCode || null,
          discount_amount: couponDiscount,
          payment_proof_url: proofUrl,
          payment_utr: paymentUTR || null,
          wallet_used: walletAmount,
          notes: notes || null,
        })
        .select()
        .single()

      if (!error && order) {
        createdOrders.push(order)

        // Deduct wallet
        if (useWallet && walletAmount > 0) {
          await supabaseAdmin
            .from('users')
            .update({ wallet_balance: Math.max(0, user.wallet_balance - walletAmount) })
            .eq('id', user.id)
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: user.id,
            type: 'debit',
            amount: walletAmount,
            reason: `Order #${orderNumber}`,
            reference_id: order.id,
          })
        }

        // Update coupon usage
        if (couponCode) {
          await supabaseAdmin
            .from('coupons')
            .update({ used_count: supabaseAdmin.rpc('increment', { x: 1 }) as unknown as number })
            .eq('code', couponCode.toUpperCase())
        }

        // Admin notification
        notifyNewOrder({ ...order, plan_name: item.plan.name } as Parameters<typeof notifyNewOrder>[0], user.name, user.email).catch(() => null)
      }
    }

    if (createdOrders.length === 0) {
      return Response.json({ error: 'Failed to create orders' }, { status: 500 })
    }

    // Send confirmation email
    sendOrderConfirmation(createdOrders[0] as Parameters<typeof sendOrderConfirmation>[0], user.email, user.name).catch(() => null)

    // Admin notification in DB
    await supabaseAdmin.from('notifications').insert({
      type: 'new_order',
      message: `New order from ${user.name} — ${items.map((i) => i.plan.name).join(', ')}`,
      data: { order_id: createdOrders[0].id, user_id: user.id },
    })

    return Response.json({ success: true, orders: createdOrders })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return Response.json({ error: 'Please login to place order' }, { status: 401 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return Response.json({ orders: orders || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

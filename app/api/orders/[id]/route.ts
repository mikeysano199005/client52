import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import { sendOrderCancelled } from '@/lib/email'
import { notifyRefundRequested, notifyReplacementRequested } from '@/lib/telegram'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { action } = await req.json()

    // Verify ownership
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

    // ── Cancel ──
    if (action === 'cancel') {
      if (order.status !== 'payment_submitted') {
        return Response.json(
          { error: 'Order cannot be cancelled at this stage. Please contact support.' },
          { status: 400 }
        )
      }

      const { data: updated, error } = await supabaseAdmin
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) return Response.json({ error: error.message }, { status: 500 })

      // Auto-refund wallet_used back to the user
      if ((order.wallet_used || 0) > 0) {
        const { data: userData } = await supabaseAdmin
          .from('users').select('wallet_balance').eq('id', user.id).single()
        if (userData) {
          const newBalance = (userData.wallet_balance || 0) + order.wallet_used
          await supabaseAdmin.from('users').update({ wallet_balance: newBalance }).eq('id', user.id)
          await supabaseAdmin.from('wallet_transactions').insert({
            user_id: user.id,
            type: 'credit',
            amount: order.wallet_used,
            reason: `Refund for cancelled order #${order.order_number}`,
            reference_id: id,
          })
        }
      }

      sendOrderCancelled(updated, user.email, user.name, 'Cancelled by customer').catch(() => null)
      return Response.json({ success: true, order: updated })
    }

    // ── Request Refund ──
    if (action === 'request_refund') {
      if (order.status !== 'delivered') {
        return Response.json({ error: 'Refund can only be requested for delivered orders.' }, { status: 400 })
      }
      if (order.refund_requested) {
        return Response.json({ error: 'Refund already requested.' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('orders')
        .update({ refund_requested: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) return Response.json({ error: error.message }, { status: 500 })

      notifyRefundRequested(order, user.name, user.email).catch(() => null)
      return Response.json({ success: true })
    }

    // ── Request Replacement ──
    if (action === 'request_replacement') {
      if (order.status !== 'delivered') {
        return Response.json({ error: 'Replacement can only be requested for delivered orders.' }, { status: 400 })
      }
      if (order.replacement_requested) {
        return Response.json({ error: 'Replacement already requested.' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('orders')
        .update({ replacement_requested: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) return Response.json({ error: error.message }, { status: 500 })

      notifyReplacementRequested(order, user.name, user.email).catch(() => null)
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

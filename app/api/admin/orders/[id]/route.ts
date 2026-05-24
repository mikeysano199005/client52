import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'
import { sendAccountDelivery } from '@/lib/email'
import { notifyLowStock } from '@/lib/telegram'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { status, admin_notes, account_id: explicitAccountId, force_reassign } = await req.json()

    // Get the current order
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*, users(name, email)')
      .eq('id', id)
      .single()

    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

    // If delivering, use explicit account_id (admin picked) or auto-assign
    let accountId = order.account_id
    if (status === 'delivered' && (!accountId || force_reassign)) {
      const stockQuery = explicitAccountId
        ? supabaseAdmin
            .from('account_stock')
            .select('id, email, password, profile_number, extra_info')
            .eq('id', explicitAccountId)
            .single()
        : supabaseAdmin
            .from('account_stock')
            .select('id, email, password, profile_number, extra_info')
            .eq('plan_id', order.plan_id)
            .eq('status', 'available')
            .limit(1)
            .single()

      const { data: stock } = await stockQuery

      if (stock) {
        accountId = stock.id
        await supabaseAdmin
          .from('account_stock')
          .update({ status: 'used', order_id: id, used_at: new Date().toISOString() })
          .eq('id', stock.id)

        // Send credentials email
        if (order.users) {
          sendAccountDelivery(
            order,
            stock as Parameters<typeof sendAccountDelivery>[1],
            order.users.email,
            order.users.name
          ).catch(() => null)
        }

        // Update plan stock count
        const { count } = await supabaseAdmin
          .from('account_stock')
          .select('id', { count: 'exact', head: true })
          .eq('plan_id', order.plan_id)
          .eq('status', 'available')
        const remaining = (count || 0)
        await supabaseAdmin
          .from('plans')
          .update({ stock_count: remaining })
          .eq('id', order.plan_id)

        // Low stock alert
        if (remaining <= 5) {
          const { data: plan } = await supabaseAdmin.from('plans').select('name').eq('id', order.plan_id).single()
          if (plan) notifyLowStock(plan.name, remaining).catch(() => null)
        }

        // Credit referral reward if first order
        const { count: orderCount } = await supabaseAdmin
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', order.user_id)
          .eq('status', 'delivered')
        if ((orderCount || 0) === 0) {
          const { data: referral } = await supabaseAdmin
            .from('referrals')
            .select('*, referrer:referrer_id(wallet_balance)')
            .eq('referred_id', order.user_id)
            .eq('status', 'pending')
            .single()
          if (referral && referral.referrer) {
            await supabaseAdmin
              .from('users')
              .update({ wallet_balance: (referral.referrer.wallet_balance || 0) + referral.reward_amount })
              .eq('id', referral.referrer_id)
            await supabaseAdmin
              .from('wallet_transactions')
              .insert({ user_id: referral.referrer_id, type: 'credit', amount: referral.reward_amount, reason: 'Referral reward', reference_id: id })
            await supabaseAdmin
              .from('referrals')
              .update({ status: 'credited', order_id: id })
              .eq('id', referral.id)
          }
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status, admin_notes, account_id: accountId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ order: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

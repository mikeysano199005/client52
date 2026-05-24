import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const { action, admin_notes } = await req.json()

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch the top-up
    const { data: topup, error: fetchErr } = await supabaseAdmin
      .from('wallet_topups')
      .select('*, user:users(id, name, wallet_balance)')
      .eq('id', id)
      .single()

    if (fetchErr || !topup) return Response.json({ error: 'Top-up not found' }, { status: 404 })
    if (topup.status !== 'pending') {
      return Response.json({ error: 'Already processed' }, { status: 400 })
    }

    if (action === 'approve') {
      const user = topup.user as { id: string; name: string; wallet_balance: number }
      const newBalance = (user.wallet_balance || 0) + topup.amount

      await Promise.all([
        // Credit wallet
        supabaseAdmin.from('users').update({ wallet_balance: newBalance }).eq('id', user.id),
        // Record transaction
        supabaseAdmin.from('wallet_transactions').insert({
          user_id: user.id,
          type: 'credit',
          amount: topup.amount,
          reason: 'Wallet top-up approved',
          reference_id: topup.id,
        }),
        // Update top-up status
        supabaseAdmin.from('wallet_topups').update({
          status: 'approved',
          admin_notes: admin_notes || null,
          updated_at: new Date().toISOString(),
        }).eq('id', id),
      ])
    } else {
      await supabaseAdmin.from('wallet_topups').update({
        status: 'rejected',
        admin_notes: admin_notes || null,
        updated_at: new Date().toISOString(),
      }).eq('id', id)
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    // If adding wallet balance
    if (body.add_wallet !== undefined) {
      const { data: user } = await supabaseAdmin.from('users').select('wallet_balance').eq('id', id).single()
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

      const newBalance = (user.wallet_balance || 0) + Number(body.add_wallet)
      await supabaseAdmin.from('users').update({ wallet_balance: newBalance }).eq('id', id)
      await supabaseAdmin.from('wallet_transactions').insert({
        user_id: id, type: 'credit', amount: Number(body.add_wallet), reason: body.reason || 'Admin credit',
      })
      return Response.json({ success: true, new_balance: newBalance })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ user: data })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

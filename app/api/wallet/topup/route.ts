import { supabaseAdmin } from '@/lib/supabase'
import { requireAuth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const user = await requireAuth()
    const formData = await req.formData()

    const amount = Number(formData.get('amount') || 0)
    const paymentUTR = (formData.get('paymentUTR') as string || '').trim()
    const proofFile = formData.get('paymentProof') as File | null

    if (!amount || amount < 10) {
      return Response.json({ error: 'Minimum top-up amount is ₹10' }, { status: 400 })
    }
    if (!paymentUTR) {
      return Response.json({ error: 'UTR / Transaction ID is required' }, { status: 400 })
    }
    if (!proofFile || proofFile.size === 0) {
      return Response.json({ error: 'Payment screenshot is required' }, { status: 400 })
    }

    // Upload proof to Supabase Storage
    const bytes = await proofFile.arrayBuffer()
    const filename = `topups/${user.id}/${Date.now()}-${proofFile.name}`
    const { data: uploadData } = await supabaseAdmin.storage
      .from('payments')
      .upload(filename, bytes, { contentType: proofFile.type })

    let proofUrl: string | null = null
    if (uploadData) {
      const { data: urlData } = supabaseAdmin.storage.from('payments').getPublicUrl(filename)
      proofUrl = urlData.publicUrl
    }

    const { data, error } = await supabaseAdmin
      .from('wallet_topups')
      .insert({
        user_id: user.id,
        amount,
        payment_utr: paymentUTR,
        payment_proof_url: proofUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return Response.json({ error: error.message }, { status: 500 })

    // Notify admin in notifications table
    await supabaseAdmin.from('notifications').insert({
      type: 'wallet_topup',
      message: `${user.name} requested wallet top-up of ₹${amount}`,
      data: { topup_id: data.id, user_id: user.id, amount },
    }).catch(() => null)

    return Response.json({ success: true, topup: data })
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await requireAuth()
    const { data } = await supabaseAdmin
      .from('wallet_topups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return Response.json({ topups: data || [] })
  } catch {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

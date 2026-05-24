import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    await requireAdmin()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

    const [ordersRes, usersRes] = await Promise.all([
      supabaseAdmin.from('orders').select('id,amount,status,plan_name,created_at'),
      supabaseAdmin.from('users').select('id', { count: 'exact' }).eq('role', 'user'),
    ])

    const orders = ordersRes.data || []
    const total_revenue = orders.filter(o => o.status === 'delivered').reduce((s: number, o: { amount: number }) => s + o.amount, 0)
    const today_revenue = orders.filter(o => o.status === 'delivered' && o.created_at >= todayStr).reduce((s: number, o: { amount: number }) => s + o.amount, 0)
    const month_revenue = orders.filter(o => o.status === 'delivered' && o.created_at >= monthStart).reduce((s: number, o: { amount: number }) => s + o.amount, 0)
    const today_orders = orders.filter(o => o.created_at >= todayStr).length
    const pending_orders = orders.filter(o => ['payment_submitted', 'under_verification', 'processing'].includes(o.status)).length
    const delivered_orders = orders.filter(o => o.status === 'delivered').length
    const cancelled_orders = orders.filter(o => o.status === 'cancelled').length

    const planMap: Record<string, { count: number; revenue: number }> = {}
    for (const o of orders) {
      if (!planMap[o.plan_name]) planMap[o.plan_name] = { count: 0, revenue: 0 }
      planMap[o.plan_name].count++
      if (o.status === 'delivered') planMap[o.plan_name].revenue += o.amount
    }
    const top_plans = Object.entries(planMap)
      .map(([plan_name, v]) => ({ plan_name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const daily: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const nextD = new Date(d)
      nextD.setDate(nextD.getDate() + 1)
      const dayOrders = orders.filter(o => o.created_at >= d.toISOString() && o.created_at < nextD.toISOString())
      daily.push({
        date: d.toISOString(),
        orders: dayOrders.length,
        revenue: dayOrders.filter(o => o.status === 'delivered').reduce((s: number, o: { amount: number }) => s + o.amount, 0),
      })
    }

    return NextResponse.json({
      total_revenue, today_revenue, month_revenue,
      total_orders: orders.length, today_orders,
      total_users: usersRes.count || 0,
      pending_orders, delivered_orders, cancelled_orders,
      top_plans, daily,
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

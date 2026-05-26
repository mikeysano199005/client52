'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, Tag, Wallet, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { getPlanLogo, getPlanCardBg } from '@/lib/logos'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SupportWidget from '@/components/support/SupportWidget'
import BackButton from '@/components/ui/BackButton'
import toast from 'react-hot-toast'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  wallet_balance: number
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCartStore()
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [useWallet, setUseWallet] = useState(false)
  const [walletAmount, setWalletAmount] = useState(0)
  const [upiId, setUpiId] = useState('')
  const [upiName, setUpiName] = useState('')
  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [paymentUTR, setPaymentUTR] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [placed, setPlaced] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const [userRes, settingsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/settings'),
      ])
      if (!userRes.ok) { router.push('/login'); return }
      const { user: u } = await userRes.json()
      if (!u) { router.push('/login'); return }
      setUser(u)
      if (settingsRes.ok) {
        const { settings } = await settingsRes.json()
        if (settings?.upi_id) setUpiId(settings.upi_id)
        if (settings?.upi_name) setUpiName(settings.upi_name)
      }
    }
    load()
  }, [router])

  useEffect(() => {
    if (items.length === 0 && !placed) router.push('/cart')
  }, [items, placed, router])

  async function validateCoupon() {
    if (!couponCode.trim()) return
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, amount: total() }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setCouponDiscount(data.discount)
    setCouponApplied(true)
    toast.success(`Coupon applied! -₹${data.discount}`)
  }

  const subtotal = total()
  const walletDeduction = useWallet ? Math.min(user?.wallet_balance || 0, Math.max(0, subtotal - couponDiscount)) : 0
  const finalAmount = Math.max(0, subtotal - couponDiscount - walletDeduction)

  async function handlePlaceOrder() {
    if (!user) return
    if (finalAmount > 0 && !paymentUTR.trim()) {
      toast.error('UTR / Transaction ID is required')
      return
    }
    if (finalAmount > 0 && !paymentProof) {
      toast.error('Please upload payment screenshot')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('items', JSON.stringify(items))
      formData.append('couponCode', couponCode)
      formData.append('couponDiscount', couponDiscount.toString())
      formData.append('useWallet', useWallet.toString())
      formData.append('walletAmount', walletDeduction.toString())
      formData.append('amount', finalAmount.toString())
      formData.append('paymentUTR', paymentUTR)
      formData.append('notes', notes)
      if (paymentProof) formData.append('paymentProof', paymentProof)

      const res = await fetch('/api/orders', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to place order')
      } else {
        setPlaced(true)
        clearCart()
        toast.success('Order placed successfully! 🎉')
      }
    } finally {
      setLoading(false)
    }
  }

  if (placed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Order Placed! 🎉</h1>
          <p className="text-zinc-400 mb-6">We received your order and will process it shortly. You&apos;ll receive your credentials via email once verified.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => router.push('/dashboard/orders')} className="py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-all">
              Track Your Order
            </button>
            <button onClick={() => router.push('/')} className="py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-all">
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <BackButton href="/cart" />
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mobile: order summary first */}
          <div className="lg:hidden space-y-4">
            <div className="glass rounded-xl p-4">
              <h2 className="font-bold text-white mb-3 text-sm">Order Summary</h2>
              <div className="space-y-2.5 mb-3">
                {items.map((item) => {
                  const coLogo = getPlanLogo(item.plan.name, item.plan.image_url)
                  const coIsBuiltin = coLogo?.startsWith('/logos/')
                  const coBg = coIsBuiltin ? getPlanCardBg(item.plan.name) : '#111113'
                  return (
                    <div key={`${item.plan.id}-${item.variant.label}`} className="flex items-center gap-2.5">
                      <div className="card-img-area w-9 h-9 rounded-lg border border-white/10 shrink-0 overflow-hidden" style={{ background: coBg }}>
                        {coLogo ? (
                          <img src={coLogo} alt={item.plan.name} className={`w-full h-full ${coIsBuiltin ? 'object-contain p-1' : 'object-cover'}`} />
                        ) : <span className="w-full h-full flex items-center justify-center text-xs font-black text-white">{item.plan.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-xs font-medium">{item.plan.name}</p>
                        <p className="text-zinc-500 text-xs">{item.variant.label}</p>
                      </div>
                      <span className="text-white shrink-0 text-sm font-semibold">{formatPrice(item.variant.price)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
                <span>Total</span>
                <span className="text-purple-400">{formatPrice(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Left: Payment details */}
          <div className="lg:col-span-2 space-y-5">
            {/* UPI Payment Info */}
            <div className="glass rounded-xl p-5">
              <h2 className="font-bold text-white mb-4">Payment Instructions</h2>

              {/* QR Code + UPI row */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* QR Code */}
                <div className="flex flex-col items-center justify-center bg-white rounded-2xl p-3 sm:w-44 shrink-0">
                  <img
                    src="/payment-qr.png"
                    alt="Scan to Pay QR"
                    className="w-36 h-36 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <p className="text-[10px] text-zinc-500 mt-1.5 font-medium">Scan to Pay</p>
                </div>

                {/* UPI details */}
                <div className="payment-upi-card flex-1 bg-purple-600/10 border border-purple-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 mb-3">Pay using any UPI app:</p>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">UPI ID</p>
                        {upiId ? (
                          <p className="font-bold text-white text-base font-mono break-all">{upiId}</p>
                        ) : (
                          <div className="h-6 w-40 skeleton rounded mt-1" />
                        )}
                        {upiName ? (
                          <p className="text-xs text-zinc-400 mt-0.5">Name: <span className="text-white font-semibold">{upiName}</span></p>
                        ) : (
                          <div className="h-4 w-28 skeleton rounded mt-1" />
                        )}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(upiId); toast.success('UPI ID copied!') }}
                        className="p-2.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg text-purple-400 transition-all shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-zinc-500">
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Fampay'].map((app) => (
                        <span key={app} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-zinc-400">{app}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Amount to Pay</p>
                    <p className="text-2xl font-bold text-white">{formatPrice(finalAmount)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                    UTR / Transaction ID <span className="text-red-400">*</span>
                    <span className="text-zinc-600 font-normal ml-1">(mandatory)</span>
                  </label>
                  <input
                    value={paymentUTR}
                    onChange={(e) => setPaymentUTR(e.target.value)}
                    placeholder="Enter 12-digit UTR / transaction number"
                    className={`input-dark ${!paymentUTR.trim() && finalAmount > 0 ? 'border-red-500/40' : ''}`}
                    required
                  />
                  <p className="text-[10px] text-zinc-600 mt-1">Find this in your payment app under transaction details</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Upload Payment Screenshot <span className="text-red-400">*</span></label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-xl p-6 text-center cursor-pointer transition-all"
                  >
                    {paymentProof ? (
                      <div className="text-green-400 flex flex-col items-center gap-1">
                        <CheckCircle className="w-6 h-6" />
                        <p className="text-sm">{paymentProof.name}</p>
                      </div>
                    ) : (
                      <div className="text-zinc-500 flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8" />
                        <p className="text-sm">Click to upload screenshot</p>
                        <p className="text-xs">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast.error('File too large — max 5MB')
                        e.target.value = ''
                        return
                      }
                      setPaymentProof(file)
                    }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1.5">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="input-dark resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Coupon */}
            <div className="glass rounded-xl p-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Coupon Code
              </h2>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-semibold">{couponCode} applied</span>
                  </div>
                  <span className="text-sm text-green-400">-{formatPrice(couponDiscount)}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input-dark flex-1"
                  />
                  <button
                    onClick={validateCoupon}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium text-sm transition-all whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Wallet */}
            {user && user.wallet_balance > 0 && (
              <div className="glass rounded-xl p-5">
                <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  Wallet Balance
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">Available: <span className="text-white font-bold">{formatPrice(user.wallet_balance)}</span></p>
                    {useWallet && <p className="text-xs text-green-400 mt-0.5">Using {formatPrice(walletDeduction)} from wallet</p>}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-zinc-400">Use Wallet</span>
                    <div
                      onClick={() => setUseWallet(!useWallet)}
                      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${useWallet ? 'bg-purple-600' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useWallet ? 'left-6' : 'left-1'}`} />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Mobile place order button */}
          <div className="lg:hidden">
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Place Order'}
            </button>
          </div>

          {/* Right: Order summary (desktop only) */}
          <div className="hidden lg:block space-y-4">
            <div className="glass rounded-xl p-5">
              <h2 className="font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const dsLogo = getPlanLogo(item.plan.name, item.plan.image_url)
                  const dsIsBuiltin = dsLogo?.startsWith('/logos/')
                  const dsBg = dsIsBuiltin ? getPlanCardBg(item.plan.name) : '#111113'
                  return (
                    <div key={`${item.plan.id}-${item.variant.label}`} className="flex items-center gap-2.5">
                      <div className="card-img-area w-9 h-9 rounded-lg border border-white/10 shrink-0 overflow-hidden" style={{ background: dsBg }}>
                        {dsLogo ? (
                          <img src={dsLogo} alt={item.plan.name} className={`w-full h-full ${dsIsBuiltin ? 'object-contain p-1' : 'object-cover'}`} />
                        ) : <span className="w-full h-full flex items-center justify-center text-xs font-black text-white">{item.plan.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate text-sm">{item.plan.name}</p>
                        <p className="text-zinc-500 text-xs">{item.variant.label}</p>
                      </div>
                      <span className="text-white shrink-0 text-sm font-semibold">{formatPrice(item.variant.price)}</span>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Coupon</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                {walletDeduction > 0 && (
                  <div className="flex justify-between text-sm text-purple-400">
                    <span>Wallet</span>
                    <span>-{formatPrice(walletDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
                  <span>Total to Pay</span>
                  <span className="text-lg">{formatPrice(finalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full mt-4 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Place Order'
                )}
              </button>
            </div>

            <div className="glass rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-400">
                  After placing order, your subscription will be delivered within 1-6 hours after payment verification. Contact support for any issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <SupportWidget defaultSubject="Checkout / Payment Issue" />
    </div>
  )
}

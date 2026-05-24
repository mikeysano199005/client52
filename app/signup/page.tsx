'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Tv, Eye, EyeOff, UserPlus, Gift } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleButton from '@/components/auth/GoogleButton'

function SignupForm() {
  const [form, setForm] = useState({ name: '', email: '', password: '', referralCode: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const ref = params.get('ref')
    if (ref) setForm((f) => ({ ...f, referralCode: ref.toUpperCase() }))
  }, [params])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Signup failed')
      } else {
        toast.success('Account created! Welcome 🎉')
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#09090b]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">DIGITAL</span>
              <span className="text-white"> OTT</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-zinc-500 text-sm mt-1">Join thousands of happy customers</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">

          {/* Google Sign Up */}
          <GoogleButton label="Sign up with Google" />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-500">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Rahul Sharma"
                className="input-dark"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="you@example.com"
                className="input-dark"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  placeholder="Min 6 characters"
                  className="input-dark pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">
                <Gift className="w-3.5 h-3.5 inline mr-1 text-purple-400" />
                Referral Code (optional — earn ₹20 bonus)
              </label>
              <input
                type="text"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                placeholder="e.g. RAHUL1234"
                className="input-dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <SignupForm />
    </Suspense>
  )
}

'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Tv, Eye, EyeOff, LogIn, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import GoogleButton from '@/components/auth/GoogleButton'
import BackButton from '@/components/ui/BackButton'

const OAUTH_ERRORS: Record<string, string> = {
  google_cancelled: 'Google sign-in was cancelled.',
  invalid_state: 'Security check failed. Please try again.',
  token_exchange: 'Failed to connect with Google. Try again.',
  no_email: 'Could not get email from Google.',
  create_failed: 'Could not create account. Please try again.',
  account_disabled: 'Your account is disabled. Contact support.',
  oauth_failed: 'Google sign-in failed. Please try again.',
}

// ── Password login ──────────────────────────────────────────────────
function PasswordTab() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
      } else {
        toast.success('Welcome back!')
        router.push(data.redirectTo || '/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
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
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all glow-purple-sm flex items-center justify-center gap-2"
      >
        {loading
          ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><LogIn className="w-4 h-4" /> Sign In</>
        }
      </button>
    </form>
  )
}

// ── OTP login ───────────────────────────────────────────────────────
function OTPTab() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to send code')
      } else {
        toast.success('Code sent! Check your inbox.')
        setStep('code')
        setCountdown(60)
      }
    } finally {
      setSending(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Invalid code')
      } else {
        toast.success('Logged in!')
        router.push(data.redirectTo || '/dashboard')
        router.refresh()
      }
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (countdown > 0) return
    setSending(true)
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to resend')
      } else {
        toast.success('New code sent!')
        setCode('')
        setCountdown(60)
      }
    } finally {
      setSending(false)
    }
  }

  if (step === 'code') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="code-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => { setStep('email'); setCode('') }}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-medium text-white">Check your email</p>
              <p className="text-xs text-zinc-500">Code sent to <span className="text-purple-400">{email}</span></p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">6-Digit Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="_ _ _ _ _ _"
                maxLength={6}
                className="input-dark text-center text-2xl font-bold tracking-[0.4em] placeholder:tracking-normal placeholder:text-base"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {verifying
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><CheckCircle className="w-4 h-4" /> Verify & Sign In</>
              }
            </button>
          </form>

          <div className="mt-4 text-center">
            {countdown > 0
              ? <p className="text-xs text-zinc-500">Resend code in <span className="text-white font-medium">{countdown}s</span></p>
              : (
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  {sending ? 'Sending...' : 'Resend code'}
                </button>
              )
            }
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.form key="email-step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="input-dark"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {sending
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Mail className="w-4 h-4" /> Send OTP Code</>
          }
        </button>
      </motion.form>
    </AnimatePresence>
  )
}

// ── Main login page ─────────────────────────────────────────────────
function LoginForm() {
  const [tab, setTab] = useState<'password' | 'otp'>('password')
  const params = useSearchParams()

  useEffect(() => {
    const err = params.get('error')
    if (err && OAUTH_ERRORS[err]) toast.error(OAUTH_ERRORS[err])
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#09090b]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-4 left-4">
        <BackButton href="/" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        {/* Logo */}
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
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-white/10">
          {/* Google */}
          <GoogleButton label="Sign in with Google" />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-5">
            <button
              onClick={() => setTab('password')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'password'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setTab('otp')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                tab === 'otp'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Email OTP
            </button>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'password' ? <PasswordTab /> : <OTPTab />}
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-sm text-zinc-500 mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <LoginForm />
    </Suspense>
  )
}

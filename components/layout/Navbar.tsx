'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, User, Search, Menu, X, Tv, Gamepad2,
  Tag, Bell, LogOut, LayoutDashboard, Settings, ChevronDown
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  user?: { name: string; role: string; wallet_balance: number } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const cartCount = useCartStore((s) => s.count())
  const router = useRouter()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQ.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#09090b]/90 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <Tv className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="gradient-text">Stream</span>
                <span className="text-white">Zone</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink href="/" icon={<Tv className="w-3.5 h-3.5" />} label="Home" />
              <NavLink href="/category/games" icon={<Gamepad2 className="w-3.5 h-3.5" />} label="Games" />
              <NavLink href="/category/combos" icon={<Tag className="w-3.5 h-3.5" />} label="Combos" />
              <NavLink href="/sale" icon={<Tag className="w-3.5 h-3.5" />} label="Sale" highlight />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all relative"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-xs font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-zinc-300 hidden sm:block max-w-[80px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-zinc-900 rounded-xl border border-white/10 shadow-2xl shadow-black/60 overflow-hidden z-[200]"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          <p className="text-xs text-purple-400">Wallet: ₹{user.wallet_balance}</p>
                        </div>
                        <div className="py-1">
                          <DropdownLink href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" />
                          <DropdownLink href="/dashboard/orders" icon={<ShoppingCart className="w-4 h-4" />} label="My Orders" />
                          {user.role === 'admin' && (
                            <DropdownLink href="/admin" icon={<Settings className="w-4 h-4" />} label="Admin Panel" />
                          )}
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-sm text-zinc-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all glow-purple-sm"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-[#09090b]/95 backdrop-blur-xl border-t border-white/10 overflow-hidden"
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                <MobileNavLink href="/" label="Home" onClick={() => setMenuOpen(false)} />
                <MobileNavLink href="/category/games" label="Games" onClick={() => setMenuOpen(false)} />
                <MobileNavLink href="/category/combos" label="Combos" onClick={() => setMenuOpen(false)} />
                <MobileNavLink href="/sale" label="Sale 🔥" onClick={() => setMenuOpen(false)} />
                {!user && (
                  <div className="flex gap-2 pt-2">
                    <Link href="/login" className="flex-1 text-center py-2 text-sm border border-white/20 rounded-lg text-zinc-300">Login</Link>
                    <Link href="/signup" className="flex-1 text-center py-2 text-sm bg-purple-600 rounded-lg text-white">Sign Up</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  autoFocus
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search plans (Netflix, Prime, Hotstar...)"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-purple-500/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-lg"
                />
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ href, label, icon, highlight }: { href: string; label: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
        highlight
          ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10'
          : 'text-zinc-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {icon}
      {label}
    </Link>
  )
}

function DropdownLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-3 py-3 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
    >
      {label}
    </Link>
  )
}

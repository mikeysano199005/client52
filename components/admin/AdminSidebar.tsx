'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Database,
  Tag, Image, Star, Settings, LogOut, Tv, ChevronRight,
  UserCheck, Gift, BarChart2, ArrowLeftRight, Headphones, LayoutGrid, Menu, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
  { href: '/admin/products', label: 'Products', icon: <LayoutGrid className="w-4 h-4" /> },
  { href: '/admin/plans', label: 'Plans (Advanced)', icon: <Package className="w-4 h-4" /> },
  { href: '/admin/stock', label: 'Account Stock', icon: <Database className="w-4 h-4" /> },
  { href: '/admin/users', label: 'Users', icon: <Users className="w-4 h-4" /> },
  { href: '/admin/coupons', label: 'Coupons', icon: <Tag className="w-4 h-4" /> },
  { href: '/admin/banners', label: 'Banners', icon: <Image className="w-4 h-4" /> },
  { href: '/admin/reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
  { href: '/admin/referrals', label: 'Referrals', icon: <UserCheck className="w-4 h-4" /> },
  { href: '/admin/transactions', label: 'Transactions', icon: <ArrowLeftRight className="w-4 h-4" /> },
  { href: '/admin/analytics', label: 'Revenue Analytics', icon: <BarChart2 className="w-4 h-4" /> },
  { href: '/admin/bonus', label: 'Bonus Settings', icon: <Gift className="w-4 h-4" /> },
  { href: '/admin/support', label: 'Support Tickets', icon: <Headphones className="w-4 h-4" /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
]

function NavList({ onClose, path, onLogout }: { onClose: () => void; path: string; onLogout: () => void }) {
  return (
    <>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group relative ${
                active
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className={active ? 'text-purple-400' : 'group-hover:text-purple-400 transition-colors'}>
                {item.icon}
              </span>
              {item.label}
              {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-purple-500" />}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          View Site
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  )
}

export default function AdminSidebar() {
  const path = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 h-14">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
            <Tv className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm text-white">
            Stream<span className="text-purple-400">Zone</span>
            <span className="text-[10px] font-normal text-zinc-500 ml-1">Admin</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0f0f11] border-r border-white/10 flex flex-col"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                    <Tv className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">StreamZone</p>
                    <p className="text-[10px] text-purple-400">Admin Panel</p>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavList onClose={() => setMobileOpen(false)} path={path} onLogout={handleLogout} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col glass border-r border-white/10 min-h-screen sticky top-0">
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
              <Tv className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">StreamZone</p>
              <p className="text-[10px] text-purple-400">Admin Panel</p>
            </div>
          </Link>
        </div>
        <NavList onClose={() => {}} path={path} onLogout={handleLogout} />
      </aside>
    </>
  )
}

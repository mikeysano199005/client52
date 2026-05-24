'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, ShoppingBag, Users, Database,
  Tag, Image, Star, Settings, LogOut, Tv, Bell, ChevronRight,
  UserCheck, Gift, BarChart2, ArrowLeftRight, Headphones, LayoutGrid
} from 'lucide-react'
import { motion } from 'framer-motion'
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

export default function AdminSidebar() {
  const path = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col glass border-r border-white/10 min-h-screen sticky top-0">
      {/* Logo */}
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

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const active = path === item.href || (item.href !== '/admin' && path.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-white/10 transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

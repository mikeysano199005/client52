import Link from 'next/link'
import { Tv, Send, MessageCircle, Globe, Share2, Play } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-white/5 mt-20">
      {/* Payment methods bar */}
      <div className="border-b border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Accepted Payments</p>
          <div className="flex items-center gap-3 flex-wrap">
            {['UPI', 'PhonePe', 'GPay', 'Paytm', 'NEFT', 'IMPS'].map((m) => (
              <span key={m} className="px-3 py-1 text-xs font-medium bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center">
                <Tv className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">
                <span className="gradient-text">Stream</span>
                <span className="text-white">Zone</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed mb-4">
              India&apos;s most trusted platform for premium OTT subscriptions at the best prices. Fast delivery, genuine accounts.
            </p>
            <div className="flex items-center gap-3">
              <SocialLink href="#" icon={<Globe className="w-4 h-4" />} />
              <SocialLink href="#" icon={<Share2 className="w-4 h-4" />} />
              <SocialLink href="#" icon={<Play className="w-4 h-4" />} />
              <SocialLink href="https://t.me/xudri" icon={<Send className="w-4 h-4" />} />
              <SocialLink href="https://wa.me/919999999999" icon={<MessageCircle className="w-4 h-4" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact Us' },
                { href: '/faq', label: 'FAQ' },
                { href: '/blog', label: 'Blog' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-purple-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Categories</h3>
            <ul className="space-y-2.5">
              {['OTT', 'Combos', 'Games', 'VPN', 'Utilities', 'Premium'].map((c) => (
                <li key={c}>
                  <Link
                    href={`/category/${c.toLowerCase()}`}
                    className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Support</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/policy/refund', label: 'Refund Policy' },
                { href: '/policy/privacy', label: 'Privacy Policy' },
                { href: '/policy/terms', label: 'Terms of Service' },
                { href: '/contact', label: 'Help Center' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-zinc-500 hover:text-purple-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} StreamZone. All rights reserved.
          </p>
          <div className="hidden sm:flex items-center gap-4">
            {['OTT', 'Games', 'Combos', 'Utilities', 'VPN'].map((c) => (
              <Link key={c} href={`/category/${c.toLowerCase()}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 bg-zinc-800 hover:bg-purple-600 border border-zinc-700 hover:border-purple-500 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-all"
    >
      {icon}
    </a>
  )
}

import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { MessageCircle, Send, Clock, Shield, Headphones } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function ContactPage() {
  const user = await getSession()
  const { data: settings } = await supabaseAdmin.from('settings').select('key, value').in('key', ['whatsapp_number', 'telegram_username'])
  const s: Record<string, string> = {}
  for (const item of settings || []) s[item.key] = item.value

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Contact Support</h1>
          <p className="text-zinc-400">We&apos;re available 24/7 to help you</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: <Clock className="w-6 h-6" />, title: '24/7 Support', desc: 'We respond within minutes', color: 'text-purple-400' },
            { icon: <Shield className="w-6 h-6" />, title: 'Secure', desc: '100% safe transactions', color: 'text-green-400' },
            { icon: <Headphones className="w-6 h-6" />, title: 'Expert Help', desc: 'Trained support team', color: 'text-cyan-400' },
          ].map((item) => (
            <div key={item.title} className="glass rounded-xl p-5 text-center">
              <div className={`${item.color} flex justify-center mb-3`}>{item.icon}</div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <a
            href={`https://wa.me/${s.whatsapp_number || '919999999999'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 rounded-2xl transition-all group"
          >
            <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">WhatsApp</p>
              <p className="text-sm text-zinc-400 group-hover:text-zinc-300">Chat with us now</p>
            </div>
          </a>

          <a
            href={`https://t.me/${s.telegram_username || 'ottsupport'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 border border-[#229ED9]/30 rounded-2xl transition-all group"
          >
            <div className="w-12 h-12 bg-[#229ED9] rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">Telegram</p>
              <p className="text-sm text-zinc-400 group-hover:text-zinc-300">Message us instantly</p>
            </div>
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}

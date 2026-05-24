import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSession } from '@/lib/auth'
import { Lock, Database, Share2, UserCheck, Mail } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — DIGITAL OTT',
  description: 'Learn how DIGITAL OTT collects, uses, and protects your personal data.',
}

export default async function PrivacyPolicyPage() {
  const user = await getSession()

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Lock className="w-3.5 h-3.5" />
            Policy Document
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Welcome to <strong className="text-white">DIGITAL OTT</strong>. We respect your privacy and are committed to
            protecting the personal data you share with us. This Privacy Policy explains how we collect,
            use, and secure your information when you use our website.
          </p>
        </div>

        <div className="space-y-6">
          <PolicySection icon={<Database className="w-5 h-5 text-blue-400" />} number="1" title="Information We Collect">
            <p>We only collect the minimum necessary details required to process your digital orders and provide customer support:</p>
            <ul>
              <li><strong>Account Information:</strong> Your name, email address, and username when you create an account or place an order.</li>
              <li><strong>Transaction Details:</strong> Information about the digital products or OTT subscriptions you purchase.</li>
              <li><strong>Contact Data:</strong> Your Telegram username or any chat details provided when you contact us for support.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<UserCheck className="w-5 h-5 text-purple-400" />} number="2" title="How We Use Your Information">
            <p>We use your collected information strictly for the following purposes:</p>
            <ul>
              <li>To deliver your purchased OTT account login credentials, profiles, or activation keys.</li>
              <li>To process secure payments for your orders.</li>
              <li>To provide customer support, verify warranty claims, and troubleshoot account issues via Telegram.</li>
              <li>To send order confirmations and important subscription renewal updates.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<Lock className="w-5 h-5 text-green-400" />} number="3" title="Data Security and Retention">
            <ul>
              <li>We do not store your complete payment card details or bank passwords on our servers. All transactions are handled securely by encrypted, third-party payment gateways.</li>
              <li>Your personal login data and order history are stored securely and are only accessible to authorized team members to process replacements or refunds.</li>
              <li>We retain your information only as long as necessary to manage your active subscriptions and fulfill our legal obligations.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<Share2 className="w-5 h-5 text-amber-400" />} number="4" title="Sharing of Data">
            <p>
              We do <strong>not</strong> sell, trade, or rent your personal data to third parties. We only share
              information with trusted third-party services essential to running our business, such as payment
              processors and web hosting providers, who are also bound by strict confidentiality agreements.
            </p>
          </PolicySection>

          <PolicySection icon={<UserCheck className="w-5 h-5 text-cyan-400" />} number="5" title="Your Rights">
            <p>
              You have the right to access, update, or request the deletion of your personal account information
              at any time. To exercise these rights or ask questions about your data, please message us directly on Telegram.
            </p>
          </PolicySection>

          <PolicySection icon={<Mail className="w-5 h-5 text-pink-400" />} number="6" title="Contact Us">
            <p>If you have any questions about this Privacy Policy or how your data is handled, contact our official support:</p>
            <ul>
              <li>Telegram: <a href="https://t.me/xudri" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">@xudri</a></li>
            </ul>
          </PolicySection>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function PolicySection({
  icon, number, title, children,
}: {
  icon: React.ReactNode
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/8">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-bold text-zinc-600">{number}.</span>
          <h2 className="font-bold text-white text-sm">{title}</h2>
        </div>
      </div>
      <div className="px-6 py-5 text-sm text-zinc-400 leading-relaxed policy-body">
        {children}
      </div>
    </div>
  )
}

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSession } from '@/lib/auth'
import { ShieldCheck, RefreshCw, XCircle, MessageCircle } from 'lucide-react'

export const metadata = {
  title: 'Refund & Replacement Policy — StreamZone',
  description: 'Understand our refund and replacement guidelines for digital OTT subscriptions.',
}

export default async function RefundPolicyPage() {
  const user = await getSession()

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Policy Document
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Refund &amp; Replacement Policy</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Thank you for shopping at <strong className="text-white">DIGITAL OTT</strong>. Because we sell digital products including
            streaming accounts, premium profiles, and activation keys, our refund and replacement guidelines
            are strictly enforced. Please read them carefully before making a purchase.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1 */}
          <PolicySection
            icon={<RefreshCw className="w-5 h-5 text-green-400" />}
            number="1"
            title="Refund Eligibility (Only If Product Doesn't Work)"
          >
            <p>We issue financial refunds strictly and only if the product or account does not work.</p>
            <ul>
              <li>If your login credentials fail upon delivery, or if the account stops working during your subscription period, contact us immediately.</li>
              <li>Our team will first attempt to resolve the issue or provide a fresh replacement account within <strong>24 hours</strong>.</li>
              <li>If we are completely unable to fix the issue or provide a working replacement, a full refund will be processed back to your original payment method.</li>
            </ul>
          </PolicySection>

          {/* Section 2 */}
          <PolicySection
            icon={<XCircle className="w-5 h-5 text-red-400" />}
            number="2"
            title="No-Refund Policy Conditions"
          >
            <p>We <strong>cannot</strong> issue refunds, returns, or order cancellations under the following circumstances:</p>
            <ul>
              <li><strong>Change of Mind:</strong> You no longer want the subscription or bought it by mistake after the account credentials have been delivered.</li>
              <li><strong>Account Misuse:</strong> You changed the master email/password, modified profile pins, or shared a designated "Shared Screen" profile with other users.</li>
              <li><strong>Device or Internet Issues:</strong> Your smart TV or device does not support the streaming application, or your internet speed is too slow to stream.</li>
            </ul>
          </PolicySection>

          {/* Section 3 */}
          <PolicySection
            icon={<MessageCircle className="w-5 h-5 text-cyan-400" />}
            number="3"
            title="How to Claim Your Refund"
          >
            <p>If your product is not working, please contact us immediately to initiate a fix or refund:</p>
            <ol>
              <li>Reach out directly to our official customer support on Telegram: <a href="https://t.me/xudri" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">@xudri</a></li>
              <li>Provide your <strong>Order ID</strong> and the product name.</li>
              <li>Attach a clear screenshot or screen-recording showing the exact login error or issue.</li>
            </ol>
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

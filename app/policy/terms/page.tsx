import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { getSession } from '@/lib/auth'
import { FileText, ShieldAlert, CreditCard, AlertTriangle, Settings, HeadphonesIcon } from 'lucide-react'
import BackButton from '@/components/ui/BackButton'

export const metadata = {
  title: 'Terms of Service — DIGITAL OTT',
  description: 'Read the Terms of Service governing use of DIGITAL OTT and our digital products.',
}

export default async function TermsPage() {
  const user = await getSession()

  return (
    <div className="min-h-screen">
      <Navbar user={user ? { name: user.name, role: user.role, wallet_balance: user.wallet_balance } : null} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="mb-6">
          <BackButton href="/" />
        </div>
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <FileText className="w-3.5 h-3.5" />
            Policy Document
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Welcome to <strong className="text-white">DIGITAL OTT</strong>. By accessing or using our website and
            purchasing our digital products, you agree to comply with and be bound by the following Terms of
            Service. Please read them carefully before completing any purchase.
          </p>
        </div>

        <div className="space-y-6">
          <PolicySection icon={<FileText className="w-5 h-5 text-blue-400" />} number="1" title="Services Provided">
            <ul>
              <li>DIGITAL OTT provides digital goods, including premium streaming account profiles, shared accounts, full private accounts, and software activation keys.</li>
              <li>All products are subject to availability, and we reserve the right to limit quantities or discontinue any product at any time without notice.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<ShieldAlert className="w-5 h-5 text-purple-400" />} number="2" title="User Accounts and Responsibility">
            <ul>
              <li>You are responsible for maintaining the confidentiality of your website account and password.</li>
              <li>You agree to provide accurate, current, and complete information during the checkout process.</li>
              <li>All delivered streaming credentials are for <strong>personal use only</strong>. Reselling, distributing, or sharing our accounts without explicit permission is strictly prohibited.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<AlertTriangle className="w-5 h-5 text-orange-400" />} number="3" title="Rules of Account Usage (Strict Policy)">
            <p>To maintain the stability of our streaming services, you must strictly follow these rules:</p>
            <ul>
              <li><strong>For Shared Accounts/Screens:</strong> You are assigned one specific profile. You must not change the master email, master password, or payment details. You must not modify the profile names or profile PINs of other users.</li>
              <li><strong>For Private/Full Accounts:</strong> You must use the account according to the official terms of the respective streaming platform.</li>
              <li>Violation of these rules will result in an <strong>immediate permanent ban</strong> from the account without a refund or replacement.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<CreditCard className="w-5 h-5 text-green-400" />} number="4" title="Payments and Pricing">
            <ul>
              <li>All prices for our premium products are listed on the website and are subject to change without prior notice.</li>
              <li>Payments must be made in full through our authorized secure payment gateways before any digital goods are delivered.</li>
              <li>You agree not to initiate fraudulent chargebacks. Any unauthorized payment disputes will result in the immediate cancellation of your services and blacklisting from future purchases.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<ShieldAlert className="w-5 h-5 text-red-400" />} number="5" title="Limitation of Liability">
            <ul>
              <li>DIGITAL OTT acts as a third-party distributor of premium digital subscriptions. We are not affiliated with, endorsed by, or partnered with Netflix, Amazon Prime, Disney+, Spotify, or any other official streaming network.</li>
              <li>We are not responsible for any sudden changes in policy, account bans, geoblocks, or feature removals implemented directly by the official streaming platforms, though we will do our best to assist you under our warranty guidelines.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<Settings className="w-5 h-5 text-zinc-400" />} number="6" title="Service Modifications and Termination">
            <ul>
              <li>We reserve the right to modify or terminate our services, website access, or these Terms of Service at any time.</li>
              <li>Continued use of the website following any updates constitutes acceptance of the new Terms of Service.</li>
            </ul>
          </PolicySection>

          <PolicySection icon={<HeadphonesIcon className="w-5 h-5 text-cyan-400" />} number="7" title="Customer Support and Disputes">
            <p>
              For all inquiries, support requests, or issues regarding account access, please reach out directly
              to our official customer support on Telegram:{' '}
              <a href="https://t.me/xudri" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 font-medium">
                @xudri
              </a>
            </p>
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

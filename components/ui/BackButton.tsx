'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  href?: string        // fixed destination — omit to use router.back()
  className?: string
}

export default function BackButton({ href, className = '' }: Props) {
  const router = useRouter()
  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      aria-label="Go back"
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-zinc-400 hover:text-white transition-all ${className}`}
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  )
}

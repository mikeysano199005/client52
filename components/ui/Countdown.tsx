'use client'
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'

function getRemainingSeconds(endsAt: string): number {
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
}

function format(n: number) {
  return String(n).padStart(2, '0')
}

interface CountdownProps {
  endsAt: string
  compact?: boolean
}

export default function Countdown({ endsAt, compact = false }: CountdownProps) {
  const [remaining, setRemaining] = useState(() => getRemainingSeconds(endsAt))

  useEffect(() => {
    setRemaining(getRemainingSeconds(endsAt))
    const id = setInterval(() => {
      const s = getRemainingSeconds(endsAt)
      setRemaining(s)
      if (s === 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (remaining === 0) return null

  const h = Math.floor(remaining / 3600)
  const m = Math.floor((remaining % 3600) / 60)
  const s = remaining % 60

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-orange-500 px-2 py-0.5 rounded-full">
        <Flame className="w-2.5 h-2.5 text-white" />
        <span className="text-[10px] font-bold text-white tabular-nums">
          {h > 0 ? `${format(h)}:` : ''}{format(m)}:{format(s)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-600/90 to-orange-500/90 px-3 py-1.5 rounded-lg">
      <Flame className="w-3.5 h-3.5 text-white shrink-0" />
      <span className="text-xs font-bold text-white">Deal ends in</span>
      <span className="text-xs font-black text-white tabular-nums tracking-wider">
        {format(h)}:{format(m)}:{format(s)}
      </span>
    </div>
  )
}

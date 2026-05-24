'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Send, X, ChevronUp } from 'lucide-react'

interface FloatingButtonsProps {
  whatsappNumber?: string
  telegramUsername?: string
}

export default function FloatingButtons({
  whatsappNumber = '919999999999',
  telegramUsername = 'xudri',
}: FloatingButtonsProps) {
  const [open, setOpen] = useState(false)
  const [showScroll, setShowScroll] = useState(false)

  useEffect(() => {
    const handler = () => setShowScroll(window.scrollY > 400)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Scroll to top */}
      <AnimatePresence>
        {showScroll && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-10 h-10 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:border-purple-500/50 transition-all shadow-lg"
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Contact options */}
      <AnimatePresence>
        {open && (
          <>
            <motion.a
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ delay: 0.05 }}
              href={`https://t.me/${telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#229ED9] hover:bg-[#1a8cc0] text-white rounded-full shadow-lg transition-all text-sm font-medium"
            >
              <Send className="w-4 h-4" />
              Telegram
            </motion.a>
            <motion.a
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1db954] text-white rounded-full shadow-lg transition-all text-sm font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </motion.a>
          </>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow text-white transition-all active:opacity-80"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}

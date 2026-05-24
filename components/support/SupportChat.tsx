'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Loader2, Lock } from 'lucide-react'

export interface SupportMessage {
  id: string
  sender_type: 'user' | 'admin'
  message: string
  is_read: boolean
  created_at: string
}

interface Props {
  ticketId: string
  isAdmin?: boolean
  status: 'open' | 'replied' | 'closed'
  onStatusChange?: (status: string) => void
  pollInterval?: number
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export default function SupportChat({ ticketId, isAdmin = false, status, onStatusChange, pollInterval = 6000 }: Props) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const apiBase = isAdmin ? `/api/admin/support/${ticketId}` : `/api/support/${ticketId}`

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch(apiBase)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
      if (!silent) setLoading(false)
    } catch {
      if (!silent) setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (status === 'closed') return
    const t = setInterval(() => fetchMessages(true), pollInterval)
    return () => clearInterval(t)
  }, [fetchMessages, pollInterval, status])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    const text = input.trim()
    if (!text || sending || status === 'closed') return
    setSending(true)
    setInput('')

    const msgEndpoint = isAdmin
      ? `/api/admin/support/${ticketId}/messages`
      : `/api/support/${ticketId}/messages`

    try {
      const res = await fetch(msgEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (res.ok) {
        const { message } = await res.json()
        setMessages(prev => [...prev, message])
        if (isAdmin && onStatusChange) onStatusChange('replied')
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-zinc-600 text-sm pt-6">
            No messages yet. Send a message below.
          </div>
        )}
        {messages.map((msg, i) => {
          const isUser = msg.sender_type === 'user'
          // From the admin panel perspective: user msgs are "them", admin msgs are "me"
          // From the user panel: user msgs are "me", admin msgs are "them"
          const isMine = isAdmin ? !isUser : isUser
          const showDateSep = i === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()

          return (
            <div key={msg.id}>
              {showDateSep && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] group`}>
                  {!isMine && (
                    <p className="text-[10px] text-zinc-500 mb-1 ml-1">
                      {isAdmin ? 'User' : 'Support'}
                    </p>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isMine
                      ? 'bg-purple-600 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
                  }`}>
                    {msg.message}
                  </div>
                  <p className={`text-[10px] text-zinc-600 mt-1 ${isMine ? 'text-right' : 'text-left'} ml-1 mr-1`}>
                    {formatTime(msg.created_at)}
                    {isMine && msg.is_read && <span className="ml-1 text-purple-400">✓✓</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {status === 'closed' ? (
        <div className="p-4 border-t border-white/10 flex items-center justify-center gap-2 text-zinc-500 text-sm">
          <Lock className="w-4 h-4" />
          This conversation is closed
        </div>
      ) : (
        <div className="p-3 border-t border-white/10 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="flex-1 bg-zinc-800 border border-white/10 rounded-2xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 resize-none outline-none focus:border-purple-500/50 transition-colors max-h-32 overflow-y-auto"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 flex items-center justify-center text-white transition-all shrink-0 mb-0.5"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}

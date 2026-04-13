import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useRoomContext, type ChatMessage } from '../context/RoomContext'
import type { RoomActions } from '../hooks/useRoom'

interface Props {
  nick: string
  actions: RoomActions
  dispatch: React.Dispatch<any>
}

function timeStr(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}

function nickColor(nick: string): string {
  const palette = ['#f97316','#ef4444','#fbbf24','#22c55e','#3b82f6','#a855f7','#ec4899','#06b6d4']
  let hash = 0
  for (let i = 0; i < nick.length; i++) hash = nick.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}

export default function Chat({ nick, actions, dispatch }: Props) {
  const { chatMessages } = useRoomContext()
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    const msg = actions.sendChat(nick, trimmed)
    dispatch({ type: 'ADD_CHAT', payload: msg })
    setText('')
  }, [text, nick, actions, dispatch])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={s.wrap}>
      {/* Messages */}
      <div style={s.messages} className="scroll-area">
        {chatMessages.length === 0 && (
          <div style={s.empty}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 8 }}>💬</span>
            Начни общение в чате
          </div>
        )}
        {chatMessages.map((msg) => (
          <MessageRow key={msg.id} msg={msg} isOwn={msg.nick === nick} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ ...s.inputRow, borderColor: focused ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)' }}>
        <input
          ref={inputRef}
          style={s.input}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Сообщение..."
          maxLength={200}
          autoComplete="off"
        />
        <button
          style={{ ...s.sendBtn, opacity: text.trim() ? 1 : 0.4 }}
          onClick={handleSend}
          disabled={!text.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

function MessageRow({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  if (msg.isSystem) {
    return (
      <div style={s.systemMsg}>
        <span>⚡</span> {msg.text}
      </div>
    )
  }
  const color = nickColor(msg.nick)
  return (
    <div style={{ ...s.msgRow, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      {!isOwn && (
        <div style={{ ...s.avatar, background: `${color}22`, border: `1px solid ${color}44`, color }}>
          {msg.nick[0]?.toUpperCase()}
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isOwn && <div style={{ ...s.nickLabel, color }}>{msg.nick}</div>}
        <div style={{
          ...s.bubble,
          background: isOwn
            ? 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(239,68,68,0.15))'
            : 'rgba(255,255,255,0.06)',
          borderColor: isOwn ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.08)',
          borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        }}>
          {msg.text}
        </div>
        <div style={{ ...s.time, textAlign: isOwn ? 'right' : 'left' }}>
          {timeStr(msg.ts)}
        </div>
      </div>
      {isOwn && (
        <div style={{ ...s.avatar, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316' }}>
          {msg.nick[0]?.toUpperCase()}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    minHeight: 0,
  },
  empty: {
    textAlign: 'center',
    color: '#555568',
    fontSize: 12,
    fontWeight: 500,
    margin: 'auto',
    padding: '20px 0',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  nickLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.05em',
    marginBottom: 3,
    paddingLeft: 4,
  },
  bubble: {
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#f0f0f5',
    border: '1px solid',
    lineHeight: 1.45,
    wordBreak: 'break-word',
  },
  time: {
    fontSize: 10,
    color: '#555568',
    marginTop: 2,
    paddingLeft: 4,
    paddingRight: 4,
  },
  systemMsg: {
    textAlign: 'center',
    fontSize: 11,
    color: '#555568',
    background: 'rgba(255,255,255,0.04)',
    padding: '6px 12px',
    borderRadius: 20,
    alignSelf: 'center',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderTop: '1px solid',
    transition: 'border-color 0.2s',
  },
  input: {
    flex: 1,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '9px 14px',
    color: '#f0f0f5',
    fontSize: 13,
    outline: 'none',
  },
  sendBtn: {
    background: 'linear-gradient(135deg, #f97316, #ef4444)',
    border: 'none',
    borderRadius: '50%',
    width: 36,
    height: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'opacity 0.2s',
  },
}

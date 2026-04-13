import React, { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

interface Props {
  roomId: string
  url: string
  onClose: () => void
}

export default function QRShareModal({ roomId, url, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width: 260,
      margin: 2,
      color: { dark: '#ffffff', light: '#000000' },
    }).catch(() => {})
  }, [url])

  const copyUrl = () => {
    navigator.clipboard.writeText(url).catch(() => {})
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={s.modal} className="anim-fadeup">

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#f97316' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span style={s.headerTitle}>Поделиться комнатой</span>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* URL */}
        <div style={s.urlBig}>tracktribe.app</div>

        {/* Room code */}
        <div style={s.codeBox}>
          <span style={s.codeText}>{roomId.toUpperCase()}</span>
        </div>

        {/* OR SCAN */}
        <div style={s.orLabel}>OR SCAN</div>

        {/* QR */}
        <div style={s.qrWrap}>
          <canvas ref={canvasRef} style={{ borderRadius: 4 }} />
        </div>

        {/* Full URL row */}
        <div style={s.fullUrlRow}>
          <div style={s.fullUrlLeft}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#555568', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <div>
              <div style={{ fontSize: 9, color: '#555568', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>FULL URL</div>
              <div style={{ fontSize: 11, color: '#8888a0', fontWeight: 500, wordBreak: 'break-all' }}>{url}</div>
            </div>
          </div>
          <button style={s.copyBtn} onClick={copyUrl} title="Копировать URL">
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modal: {
    background: '#141418',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16,
    width: 340,
    maxWidth: '100%',
    overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 13, fontWeight: 700, color: '#f0f0f5' },
  closeBtn: {
    background: 'none', border: 'none',
    color: '#555568', fontSize: 14, cursor: 'pointer',
    padding: '4px 6px', borderRadius: 6,
    transition: 'color 0.2s',
  },
  urlBig: {
    textAlign: 'center',
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: '0.06em',
    color: '#f0f0f5',
    padding: '20px 20px 12px',
  },
  codeBox: {
    background: '#0c0c0f',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '10px 20px',
    margin: '0 20px 16px',
    textAlign: 'center',
  },
  codeText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 26,
    letterSpacing: '0.15em',
    color: '#f0f0f5',
  },
  orLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: '#555568',
    letterSpacing: '0.12em',
    marginBottom: 14,
  },
  qrWrap: {
    display: 'flex', justifyContent: 'center',
    padding: '0 20px 16px',
  },
  fullUrlRow: {
    display: 'flex', alignItems: 'center',
    gap: 12,
    background: '#0c0c0f',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    padding: '14px 20px',
  },
  fullUrlLeft: {
    flex: 1, display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0,
  },
  copyBtn: {
    background: 'rgba(249,115,22,0.1)',
    border: '1px solid rgba(249,115,22,0.2)',
    borderRadius: 7,
    color: '#f97316',
    padding: '7px 9px',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    flexShrink: 0,
    transition: 'background 0.2s',
  },
}

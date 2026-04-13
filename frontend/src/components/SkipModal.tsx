import React from 'react'
import type { SkipState } from '../context/RoomContext'

interface Props {
  skipState: SkipState
  onVote: (agree: boolean) => void
}

export default function SkipModal({ skipState, onVote }: Props) {
  const { current, threshold } = skipState
  const pct = Math.min((current / Math.max(threshold, 1)) * 100, 100)

  return (
    // overlay
    <div
      style={s.overlay}
      onClick={e => { if (e.target === e.currentTarget) onVote(false) }}
    >
      <div style={s.box} className="anim-fadeup">
        {/* Icon */}
        <div style={s.icon}>⏭</div>

        {/* Title */}
        <h2 style={s.title}>Пропустить трек?</h2>
        <p style={s.sub}>Кто-то хочет пропустить текущий трек</p>

        {/* Progress bar */}
        <div style={s.bar}>
          <div style={{ ...s.fill, width: `${pct}%` }} />
        </div>
        <p style={s.count}>
          <span style={{ color: '#f97316', fontWeight: 700 }}>{current}</span>
          {' '}из{' '}
          <span style={{ color: '#f0f0f5', fontWeight: 700 }}>{threshold}</span>
          {' '}голосов
        </p>

        {/* Buttons */}
        <div style={s.btns}>
          <button
            className="btn-fire"
            style={{ flex: 1, padding: 14 }}
            onClick={() => onVote(true)}
          >
            ⏭ Пропустить
          </button>
          <button
            className="btn-outline-fire"
            style={{ flex: 1, padding: 14, borderColor: 'rgba(255,255,255,0.12)', color: '#8888a0' }}
            onClick={() => onVote(false)}
          >
            ✕ Не надо
          </button>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.78)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    background: '#1a1a20',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '36px 40px',
    width: 360,
    maxWidth: '100%',
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
  },
  icon: { fontSize: 40, marginBottom: 14 },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 28,
    letterSpacing: '0.05em',
    color: '#f0f0f5',
    marginBottom: 6,
  },
  sub: { fontSize: 13, color: '#8888a0', marginBottom: 22 },
  bar: {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  fill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #ef4444)',
    borderRadius: 4,
    transition: 'width 0.4s ease',
  },
  count: { fontSize: 13, color: '#8888a0', marginBottom: 28 },
  btns: { display: 'flex', gap: 12 },
}

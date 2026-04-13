import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../services/api'
import { useToast } from '../context/ToastContext'
import logo from '/logo.png'

const ADJ  = ['cosmic','tribal','blazing','hypnotic','stellar','electric','neon','mystic','atomic','sonic','lunar','vortex']
const NOUN = ['fox','wolf','hawk','bear','lynx','viper','raven','panther','tiger','shark','falcon','cobra']
function randomNick() {
  return `${ADJ[Math.floor(Math.random()*ADJ.length)]}-${NOUN[Math.floor(Math.random()*NOUN.length)]}`
}
function getOrSetNick(): string {
  let n = localStorage.getItem('tt_nick')
  if (!n) { n = randomNick(); localStorage.setItem('tt_nick', n) }
  return n
}

export default function LandingPage() {
  const nav = useNavigate()
  const { showToast } = useToast()
  const [nick, setNick] = useState(getOrSetNick)
  const [loading, setLoading] = useState(false)
  const [listeners] = useState(Math.floor(Math.random() * 80 + 20))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [codeVals, setCodeVals] = useState(['','','','','',''])

  // ambient particle effect
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const particles = Array.from({length: 40}, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.4 + 0.05,
    }))
    let raf: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(249,115,22,${p.o})`
        ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleCodeInput = (i: number, val: string) => {
    const ch = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1)
    const next = [...codeVals]; next[i] = ch; setCodeVals(next)
    if (ch && i < 5) inputRefs.current[i+1]?.focus()
  }
  const handleCodeKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeVals[i] && i > 0) inputRefs.current[i-1]?.focus()
  }
  const handlePaste = (i: number, e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '')
    const next = [...codeVals]
    paste.split('').forEach((ch, j) => { if (i+j < 6) next[i+j] = ch })
    setCodeVals(next)
    inputRefs.current[Math.min(i + paste.length, 5)]?.focus()
  }
  const regenNick = () => {
    const n = randomNick(); localStorage.setItem('tt_nick', n); setNick(n)
    showToast('Никнейм изменён', 'success')
  }
  const joinRoom = () => {
    const code = codeVals.join('')
    if (code.length < 4) { showToast('Введите код комнаты', 'error'); return }
    nav(`/room/${code.toLowerCase()}`)
  }
  const handleCreate = async () => {
    setLoading(true)
    try {
      const { roomId, hostToken } = await createRoom()
      nav(`/room/${roomId}?host=1&token=${hostToken}`)
    } catch { showToast('Не удалось создать комнату', 'error') }
    finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <canvas ref={canvasRef} style={s.canvas} />

      {/* Grid decoration */}
      <div style={s.gridLines} />

      <div style={s.wrapper}>
        {/* ── Header ── */}
        <div style={s.header} className="anim-fadeup">
          <div style={s.logoWrap}>
            <img src={logo} alt="TrackTribe" style={s.logo} />
            <div style={s.glow} />
          </div>
          <h1 style={s.brand} className="heading">TRACKTRIBE</h1>
          <p style={s.tagline}>Музыкальная демократия на вечеринке</p>
          <div style={s.liveBadge}>
            <span className="dot dot-green" />
            <span style={{ color: '#22c55e', fontWeight: 700 }}>{listeners}</span>
            &nbsp;слушают сейчас
          </div>
        </div>

        {/* ── Card ── */}
        <div style={s.card} className="card anim-fadeup delay-1">

          {/* Divider with label */}
          <div style={s.dividerRow}>
            <div style={s.divLine} />
            <span style={s.divLabel}>ВОЙТИ В КОМНАТУ</span>
            <div style={s.divLine} />
          </div>

          {/* Code boxes */}
          <div style={s.codeGrid}>
            {codeVals.map((v, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                style={s.codeBox}
                maxLength={1}
                value={v}
                autoComplete="off"
                spellCheck={false}
                onChange={e => handleCodeInput(i, e.target.value)}
                onKeyDown={e => handleCodeKeyDown(i, e)}
                onPaste={e => handlePaste(i, e)}
                onFocus={e => {
                  e.target.style.borderColor = '#f97316'
                  e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2), 0 0 20px rgba(249,115,22,0.15)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = v ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.1)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            ))}
          </div>

          {/* Nick line */}
          <div style={s.nickRow}>
            <span style={{ color: 'var(--text2)', fontSize: 12 }}>Войдёте как</span>
            <span style={s.nickName}>{nick}</span>
            <button style={s.regenBtn} onClick={regenNick}>↺</button>
          </div>

          {/* Actions */}
          <button className="btn-outline-fire" style={{ width: '100%', marginBottom: 10 }} onClick={joinRoom}>
            <ArrowRightIcon /> Войти в комнату
          </button>
          <button className="btn-fire" style={{ width: '100%' }} onClick={handleCreate} disabled={loading}>
            <PlusIcon /> {loading ? 'Создаём...' : 'Создать комнату'}
          </button>

          {/* Divider */}
          <div style={s.dividerThin} />

          {/* Features */}
          <div style={s.features}>
            {[
              { icon: '⚡', text: 'Без установки приложений' },
              { icon: '🗳️', text: 'Голосование за треки' },
              { icon: '🎯', text: 'QR-код для входа гостей' },
            ].map((f, i) => (
              <div key={i} style={s.featureItem}>
                <span style={s.featureIcon}>{f.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={s.footer} className="anim-fadeup delay-3">
          <a href="/saved" style={s.footerLink}>💾 Сохранённые треки</a>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <a href="#" style={s.footerLink}>Discord</a>
          <span style={{ color: 'var(--text3)' }}>·</span>
          <a href="#" style={s.footerLink}>GitHub</a>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.12) 0%, transparent 70%), var(--bg)',
  },
  canvas: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    pointerEvents: 'none', opacity: 0.6,
  },
  gridLines: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 80%)',
  },
  wrapper: {
    width: 440, maxWidth: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    position: 'relative', zIndex: 1,
  },
  header: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  logoWrap: { position: 'relative', display: 'inline-block' },
  logo: { width: 80, height: 'auto', position: 'relative', zIndex: 1 },
  glow: {
    position: 'absolute', inset: -20,
    background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
    pointerEvents: 'none', borderRadius: '50%',
  },
  brand: {
    fontFamily: 'var(--font-display)',
    fontSize: 38, letterSpacing: '0.1em',
    color: 'var(--text)', lineHeight: 1,
    textShadow: '0 0 30px rgba(249,115,22,0.3)',
  },
  tagline: { fontSize: 13, color: 'var(--text2)', fontWeight: 500 },
  liveBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    background: 'rgba(34,197,94,0.07)',
    border: '1px solid rgba(34,197,94,0.2)',
    borderRadius: 100, padding: '5px 14px',
    fontSize: 12, color: 'var(--text2)', fontWeight: 600,
  },
  card: {
    width: '100%', padding: '32px 28px',
    background: 'rgba(16,16,26,0.9)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
  },
  dividerRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  divLine: { flex: 1, height: 1, background: 'var(--border2)' },
  divLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
    color: 'var(--text3)', whiteSpace: 'nowrap',
    fontFamily: 'var(--font-display)',
  },
  dividerThin: { height: 1, background: 'var(--border)', margin: '20px 0' },
  codeGrid: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 },
  codeBox: {
    width: 52, height: 58,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    textAlign: 'center',
    fontFamily: 'var(--font-display)',
    fontSize: 26, fontWeight: 700,
    color: 'var(--text)',
    outline: 'none',
    caretColor: '#f97316',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  nickRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 18, fontSize: 12,
  },
  nickName: { color: 'var(--text)', fontWeight: 600, fontSize: 12 },
  regenBtn: {
    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
    borderRadius: 6, color: '#f97316', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', padding: '2px 7px', lineHeight: 1.4,
    transition: 'background 0.2s',
  },
  features: { display: 'flex', flexDirection: 'column', gap: 8 },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10, border: '1px solid var(--border)',
  },
  featureIcon: { fontSize: 15, flexShrink: 0 },
  footer: {
    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
  },
  footerLink: { fontSize: 12, color: 'var(--text2)', fontWeight: 500, transition: 'color 0.2s' },
}

function ArrowRightIcon() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
}
function PlusIcon() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
}

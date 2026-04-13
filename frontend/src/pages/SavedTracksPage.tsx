import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Track } from '../context/RoomContext'
import logo from '/logo.png'

function getSaved(): Track[] {
  try { return JSON.parse(localStorage.getItem('tt_saved') || '[]') } catch { return [] }
}

export default function SavedTracksPage() {
  const [tracks, setTracks] = useState<Track[]>(getSaved)

  const remove = (id: string) => {
    const updated = tracks.filter(t => t.info.id !== id)
    setTracks(updated)
    localStorage.setItem('tt_saved', JSON.stringify(updated))
  }

  const exportTxt = () => {
    const text = tracks.map(t => `${t.info.artist} — ${t.info.title}`).join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'tracktribe-playlist.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <img src={logo} alt="TrackTribe" style={s.logo} />
        <div>
          <h1 style={s.title}>МОИ ТРЕКИ</h1>
          <p style={s.sub}>Сохранённые с вечеринок</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {tracks.length > 0 && (
            <button className="btn-outline-fire" style={{ padding: '10px 18px', fontSize: 13 }} onClick={exportTxt}>
              💾 Экспорт .txt
            </button>
          )}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button className="btn-fire" style={{ padding: '10px 18px', fontSize: 13 }}>
              ← На главную
            </button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {tracks.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎶</div>
            <p style={{ color: '#8888a0', marginBottom: 20, fontSize: 15 }}>
              Здесь пусто. Заходи в комнаты и сохраняй треки 💾
            </p>
            <Link to="/">
              <button className="btn-fire">Создать комнату</button>
            </Link>
          </div>
        ) : (
          <ul style={s.list}>
            {tracks.map((t, i) => (
              <li key={t.info.id} style={s.item} className="anim-fadeup">
                <span style={s.num}>{i + 1}</span>
                <img
                  src={t.info.image}
                  alt={t.info.title}
                  style={s.thumb}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.trackName}>{t.info.title}</div>
                  <div style={s.artist}>{t.info.artist}</div>
                </div>
                {t.info.previewUrl && (
                  <a
                    href={t.info.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={s.previewBtn}
                    title="Превью"
                  >▶</a>
                )}
                <button style={s.delBtn} onClick={() => remove(t.info.id)} title="Удалить">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '24px 20px',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
    flexWrap: 'wrap',
  },
  logo: { width: 56, height: 'auto', filter: 'drop-shadow(0 0 12px rgba(249,115,22,0.35))' },
  title: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 32,
    letterSpacing: '0.06em',
    color: '#f0f0f5',
    lineHeight: 1,
  },
  sub: { fontSize: 12, color: '#555568', fontWeight: 500, marginTop: 2 },
  content: { maxWidth: 640, margin: '0 auto' },
  empty: { textAlign: 'center', paddingTop: 80 },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 },
  item: {
    background: '#1a1a20',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    transition: 'background 0.15s',
  },
  num: { fontSize: 11, color: '#555568', fontWeight: 700, width: 20, textAlign: 'center', flexShrink: 0 },
  thumb: {
    width: 44, height: 44,
    borderRadius: 8,
    objectFit: 'cover',
    background: '#141418',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  trackName: { fontWeight: 700, fontSize: 13, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artist:    { fontSize: 11, color: '#8888a0', marginTop: 2 },
  previewBtn: {
    background: 'rgba(249,115,22,0.12)',
    border: '1px solid rgba(249,115,22,0.25)',
    borderRadius: 8,
    color: '#f97316',
    fontSize: 13,
    padding: '6px 12px',
    cursor: 'pointer',
    textDecoration: 'none',
    flexShrink: 0,
  },
  delBtn: {
    background: 'none',
    border: 'none',
    color: '#555568',
    fontSize: 14,
    cursor: 'pointer',
    padding: '5px 8px',
    borderRadius: 6,
    transition: 'color 0.2s',
    flexShrink: 0,
  },
}

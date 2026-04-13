import React, { useState, useRef, useCallback } from 'react'
import { searchTracks, type ItunesTrack } from '../services/itunes'
import type { TrackInfo } from '../context/RoomContext'

interface Props {
  onAdd: (info: TrackInfo) => void
}

export default function SearchBar({ onAdd }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<ItunesTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen]       = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(timer.current)
    if (!q.trim()) { setResults([]); setOpen(false); return }

    timer.current = setTimeout(async () => {
      setLoading(true)
      const res = await searchTracks(q)
      setResults(res)
      setOpen(res.length > 0)
      setLoading(false)
    }, 380)
  }, [])

  const handleAdd = (track: ItunesTrack) => {
    onAdd({
      id:         String(track.trackId),
      title:      track.trackName,
      artist:     track.artistName,
      image:      track.artworkUrl100,
      duration:   Math.round(track.trackTimeMillis / 1000),
      previewUrl: track.previewUrl,
    })
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleBlur = () => setTimeout(() => setOpen(false), 200)

  return (
    <div style={s.wrap}>
      {/* Input */}
      <div style={s.inputWrap}>
        <span style={s.icon}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          style={s.input}
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          placeholder="Поиск треков через iTunes..."
          autoComplete="off"
        />
        {loading && <span style={s.spinner}>⏳</span>}
      </div>

      {/* Results dropdown */}
      {open && (
        <ul style={s.dropdown}>
          {results.slice(0, 6).map(t => (
            <li key={t.trackId} style={s.resultItem}>
              <img
                src={t.artworkUrl100}
                alt={t.trackName}
                style={s.thumb}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
              />
              <div style={s.info}>
                <div style={s.trackName}>{t.trackName}</div>
                <div style={s.artist}>{t.artistName}</div>
              </div>
              <button
                className="btn-fire"
                style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                onClick={() => handleAdd(t)}
              >
                + Добавить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: { position: 'relative', width: '100%' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: {
    position: 'absolute',
    left: 13,
    color: '#555568',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#1a1a20',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '12px 16px 12px 40px',
    color: '#f0f0f5',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  spinner: { position: 'absolute', right: 12, fontSize: 14 },
  dropdown: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    background: '#1a1a20',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
    zIndex: 50,
    listStyle: 'none',
    boxShadow: '0 -12px 32px rgba(0,0,0,0.5)',
    animation: 'fadeUp 0.2s ease',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  thumb: {
    width: 38, height: 38,
    borderRadius: 7,
    objectFit: 'cover',
    background: '#141418',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  info: { flex: 1, minWidth: 0 },
  trackName: { fontSize: 13, fontWeight: 700, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  artist:    { fontSize: 11, color: '#8888a0', marginTop: 2 },
}

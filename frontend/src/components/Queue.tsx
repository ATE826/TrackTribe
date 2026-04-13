import React from 'react'
import type { Track } from '../context/RoomContext'

interface Props {
  tracks: Track[]
  isHost: boolean
  likedIds: Set<string>
  onVote: (queueId: string, value: boolean) => void
  onRemove?: (queueId: string) => void
  onSave?: (track: Track) => void
}

export default function Queue({ tracks, isHost, likedIds, onVote, onRemove, onSave }: Props) {
  if (!tracks.length) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🎶</div>
        <div>Очередь пуста — найди первый трек!</div>
      </div>
    )
  }

  return (
    <ul style={{ listStyle: 'none' }}>
      {tracks.map((track, i) => {
        const liked = likedIds.has(track.queueId)
        return (
          <li key={track.queueId} style={s.item} className="anim-fadeup">
            <span style={s.num}>{i + 1}</span>

            <img
              src={track.info.image}
              alt={track.info.title}
              style={s.cover}
              onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={s.trackName}>{track.info.title}</div>
              <div style={s.artist}>{track.info.artist}</div>
            </div>

            <div style={s.actions}>
              {/* Like button (гость голосует) */}
              <button
                style={{
                  ...s.likeBtn,
                  color:      liked ? '#f97316' : '#555568',
                  background: liked ? 'rgba(249,115,22,0.1)' : 'none',
                }}
                onClick={() => onVote(track.queueId, !liked)}
                title={liked ? 'Убрать лайк' : 'Лайк'}
              >
                <HeartIcon filled={liked} />
                {track.votes}
              </button>

              {/* Save button (только для гостя) */}
              {onSave && !isHost && (
                <button style={s.iconBtn} onClick={() => onSave(track)} title="Сохранить трек">
                  <SaveIcon />
                </button>
              )}

              {/* Delete button (только хост) */}
              {isHost && onRemove && (
                <button
                  style={s.iconBtn}
                  onClick={() => onRemove(track.queueId)}
                  title="Удалить"
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#ef4444')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#555568')}
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

const s: Record<string, React.CSSProperties> = {
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#555568',
    fontSize: 13,
    fontWeight: 500,
  },
  item: {
    background: '#1a1a20',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    transition: 'background 0.15s, border-color 0.15s',
  },
  num: {
    fontSize: 11,
    color: '#555568',
    fontWeight: 700,
    width: 18,
    textAlign: 'center',
    flexShrink: 0,
  },
  cover: {
    width: 44, height: 44,
    borderRadius: 8,
    objectFit: 'cover',
    background: '#141418',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  trackName: {
    fontWeight: 700,
    fontSize: 13,
    color: '#f0f0f5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  artist: { fontSize: 11, color: '#8888a0', marginTop: 2 },
  actions: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  likeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    border: 'none',
    borderRadius: 8,
    padding: '5px 9px',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Montserrat', sans-serif",
    cursor: 'pointer',
    transition: 'color 0.2s, background 0.2s',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: '#555568',
    cursor: 'pointer',
    padding: '5px 7px',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s, background 0.2s',
  },
}

// ── Icons ──────────────────────────────────────────────────────────────────
function HeartIcon({ filled }: { filled: boolean }) {
  return filled
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#f97316"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
}

function SaveIcon() {
  return <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
}

function TrashIcon() {
  return <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
}

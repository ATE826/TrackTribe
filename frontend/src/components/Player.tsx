import React, { useRef, useEffect, useCallback } from 'react'
import type { Track, PlaybackState } from '../context/RoomContext'

interface Props {
  currentTrack: Track | null
  playback: PlaybackState
  isHost: boolean
  onControl?: (action: string, value?: number) => void
  onTimeUpdate?: (currentTime: number, isPlaying: boolean) => void
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Player({ currentTrack, playback, isHost, onControl, onTimeUpdate }: Props) {
  const audioRef  = useRef<HTMLAudioElement>(null)
  const syncTimer = useRef<ReturnType<typeof setInterval>>()

  // ── Синхронизация аудио (только хост) ─────────────────────────────────
  useEffect(() => {
    if (!isHost || !audioRef.current) return
    const audio = audioRef.current
    audio.volume = playback.volume
    if (playback.isPlaying) {
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }
  }, [playback.isPlaying, playback.volume, isHost])

  // Хост каждые 2с отправляет текущее время гостям
  useEffect(() => {
    if (!isHost || !onTimeUpdate) return
    syncTimer.current = setInterval(() => {
      if (audioRef.current) {
        onTimeUpdate(audioRef.current.currentTime, !audioRef.current.paused)
      }
    }, 2000)
    return () => clearInterval(syncTimer.current)
  }, [isHost, onTimeUpdate])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHost || !currentTrack) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const time  = ratio * (currentTrack.info.duration || 1)
    if (audioRef.current) audioRef.current.currentTime = time
    onControl?.('seek', time)
  }, [isHost, currentTrack, onControl])

  // ── Если трек не выбран ────────────────────────────────────────────────
  if (!currentTrack) {
    return (
      <div style={s.empty}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎵</div>
        <div style={{ color: '#555568', fontSize: 13 }}>Нет текущего трека</div>
      </div>
    )
  }

  const { info }     = currentTrack
  const duration     = info.duration || 1
  const progress     = Math.min((playback.currentTime / duration) * 100, 100)

  return (
    <div style={s.player}>
      {/* Аудио элемент (только хост) */}
      {isHost && info.previewUrl && (
        <audio
          ref={audioRef}
          src={info.previewUrl}
          preload="auto"
          onEnded={() => onControl?.('next')}
        />
      )}

      {/* Обложка + мета */}
      <div style={s.trackRow}>
        <img
          src={info.image}
          alt={info.title}
          style={s.cover}
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.title}>{info.title}</div>
          <div style={s.artist}>{info.artist}</div>
        </div>
        {/* Бейдж гостя */}
        {!isHost && (
          <div style={s.guestBadge}>
            <span style={s.liveDot} />
            LIVE
          </div>
        )}
      </div>

      {/* Прогресс-бар */}
      <div style={s.progressWrap}>
        <span style={s.time}>{fmt(playback.currentTime)}</span>
        <div
          style={{ ...s.progressBar, cursor: isHost ? 'pointer' : 'default' }}
          onClick={seekTo}
          title={isHost ? 'Перемотать' : undefined}
        >
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>
        <span style={s.time}>{fmt(duration)}</span>
      </div>

      {/* Кнопки управления — только хост */}
      {isHost && (
        <>
          <div style={s.controls}>
            <button style={s.ctrlBtn} onClick={() => onControl?.('prev')} title="Предыдущий">
              <PrevIcon />
            </button>

            <button
              style={{ ...s.ctrlBtn, ...s.playBtn }}
              onClick={() => onControl?.(playback.isPlaying ? 'pause' : 'play')}
            >
              {playback.isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            <button style={s.ctrlBtn} onClick={() => onControl?.('next')} title="Следующий">
              <NextIcon />
            </button>
          </div>

          {/* Громкость */}
          <div style={s.volumeRow}>
            <VolumeIcon />
            <input
              type="range"
              min={0} max={1} step={0.01}
              value={playback.volume}
              style={s.slider}
              onChange={e => {
                const v = parseFloat(e.target.value)
                if (audioRef.current) audioRef.current.volume = v
                onControl?.('volume', v)
              }}
            />
            <VolumeHighIcon />
          </div>
        </>
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  empty: {
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: { padding: '20px' },
  trackRow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 },
  cover: {
    width: 56, height: 56,
    borderRadius: 10,
    objectFit: 'cover',
    background: '#141418',
    flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  title: {
    fontWeight: 700,
    fontSize: 15,
    color: '#f0f0f5',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  artist: { fontSize: 12, color: '#8888a0', marginTop: 2 },
  guestBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(249,115,22,0.1)',
    border: '1px solid rgba(249,115,22,0.25)',
    borderRadius: 6,
    padding: '4px 9px',
    fontSize: 10,
    fontWeight: 700,
    color: '#f97316',
    letterSpacing: '0.08em',
    flexShrink: 0,
  },
  liveDot: {
    width: 6, height: 6,
    background: '#f97316',
    borderRadius: '50%',
    animation: 'pulse 1.5s infinite',
    display: 'inline-block',
  },
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  time: { fontSize: 10, color: '#555568', fontWeight: 600, flexShrink: 0, minWidth: 30 },
  progressBar: {
    flex: 1,
    height: 4,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f97316, #ef4444)',
    borderRadius: 2,
    transition: 'width 0.8s linear',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 14,
  },
  ctrlBtn: {
    background: 'none',
    border: 'none',
    color: '#8888a0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36, height: 36,
    borderRadius: '50%',
    transition: 'color 0.2s, background 0.2s',
  },
  playBtn: {
    background: 'linear-gradient(135deg, #f97316, #ef4444)',
    color: '#fff',
    width: 46, height: 46,
    boxShadow: '0 6px 18px rgba(249,115,22,0.35)',
  },
  volumeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#555568',
  },
  slider: {
    flex: 1,
    WebkitAppearance: 'none',
    height: 4,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    outline: 'none',
    cursor: 'pointer',
  },
}

// ── Icons ──────────────────────────────────────────────────────────────────
const iconProps = { width: 20, height: 20, fill: 'currentColor', viewBox: '0 0 24 24' } as const

function PlayIcon()  { return <svg {...iconProps}><path d="M8 5v14l11-7z"/></svg> }
function PauseIcon() { return <svg {...iconProps}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> }
function NextIcon()  { return <svg {...iconProps}><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg> }
function PrevIcon()  { return <svg {...iconProps}><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg> }
function VolumeIcon() { return <svg width={14} height={14} fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg> }
function VolumeHighIcon() { return <svg width={14} height={14} fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM16.5 3v2A7 7 0 0119.82 12a7 7 0 01-3.32 6.03v1.95A9 9 0 0021.82 12 9 9 0 0016.5 3z"/></svg> }

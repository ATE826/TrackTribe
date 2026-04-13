import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomContext } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import type { RoomActions } from '../hooks/useRoom'
import type { Track } from '../context/RoomContext'
import QRShareModal from './QRShareModal'
import logo from '/logo.png'

interface Props {
  roomId: string
  hostToken: string
  clientId: string
  actions: RoomActions
}

interface ItunesResult {
  trackId: number
  trackName: string
  artistName: string
  artworkUrl100: string
  trackTimeMillis: number
  previewUrl?: string
}

async function itunesSearch(q: string): Promise<ItunesResult[]> {
  if (!q.trim()) return []
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=8`)
    if (!res.ok) return []
    return (await res.json()).results ?? []
  } catch { return [] }
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function HostView({ roomId, actions }: Props) {
  const nav = useNavigate()
  const { queue, currentTrack, playback, guestCount } = useRoomContext()
  const { showToast } = useToast()

  const [showQR, setShowQR] = useState(false)
  const [likedIds] = useState(new Set<string>())
  const [permMode, setPermMode] = useState<'everyone' | 'admins'>('everyone')

  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState<ItunesResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const audioRef = useRef<HTMLAudioElement>(null)
  const syncTimer = useRef<ReturnType<typeof setInterval>>()
  const roomUrl = `${location.origin}/room/${roomId}`

  // Audio sync
  useEffect(() => {
    if (!audioRef.current) return
    const audio = audioRef.current
    audio.volume = Math.min(1, Math.max(0, playback.volume))
    if (playback.isPlaying) { audio.play().catch(() => {}) }
    else { audio.pause() }
  }, [playback.isPlaying, playback.volume])

  useEffect(() => {
    syncTimer.current = setInterval(() => {
      if (audioRef.current) {
        actions.updatePlayback(audioRef.current.currentTime, !audioRef.current.paused)
      }
    }, 2000)
    return () => clearInterval(syncTimer.current)
  }, [actions])

  useEffect(() => {
    if (audioRef.current && currentTrack?.info.previewUrl) {
      audioRef.current.load()
      if (playback.isPlaying) audioRef.current.play().catch(() => {})
    }
  }, [currentTrack?.queueId])

  // Search
  const handleSearch = (val: string) => {
    setSearchQ(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchRes([]); setSearchOpen(false); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      const res = await itunesSearch(val)
      setSearchRes(res)
      setSearchOpen(res.length > 0)
      setSearching(false)
    }, 380)
  }

  const addTrack = useCallback((t: ItunesResult) => {
    actions.addTrack({
      id: String(t.trackId),
      title: t.trackName,
      artist: t.artistName,
      image: t.artworkUrl100,
      duration: Math.round(t.trackTimeMillis / 1000),
      previewUrl: t.previewUrl,
    })
    setSearchQ('')
    setSearchRes([])
    setSearchOpen(false)
    showToast(`Добавлен: ${t.trackName}`, 'success')
  }, [actions, showToast])

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || !audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const time = ratio * (currentTrack.info.duration || 1)
    audioRef.current.currentTime = time
    actions.playbackControl('seek', time)
  }, [currentTrack, actions])

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes)
  const duration = currentTrack?.info.duration || 1
  const progress = Math.min((playback.currentTime / duration) * 100, 100)
  const nick = localStorage.getItem('tt_nick') || 'host'

  return (
    <div style={s.root}>
      {/* Hidden audio element */}
      {currentTrack?.info.previewUrl && (
        <audio
          ref={audioRef}
          src={currentTrack.info.previewUrl}
          preload="auto"
          onEnded={() => actions.playbackControl('next')}
        />
      )}

      {/* ════════════════ LEFT SIDEBAR ════════════════ */}
      <aside style={s.sidebar}>
        <div style={s.sideHeader}>
          <img src={logo} alt="" style={s.sidebarLogo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.roomIdLabel}># {roomId.toUpperCase()}</div>
          </div>
          <button style={s.qrBtn} onClick={() => setShowQR(true)}>
            <QrIconSm /> QR
          </button>
        </div>

        {/* Playback permissions */}
        <div style={s.sideSection}>
          <div style={s.sideSectionTitle}>
            <PlayTriangle /> PLAYBACK PERMISSIONS
          </div>
          <div style={s.permRow}>
            <button
              style={{ ...s.permBtn, ...(permMode === 'everyone' ? s.permActive : {}) }}
              onClick={() => setPermMode('everyone')}
            >
              <UserGroupIcon /> Everyone
            </button>
            <button
              style={{ ...s.permBtn, ...(permMode === 'admins' ? s.permActive : {}) }}
              onClick={() => setPermMode('admins')}
            >
              <ShieldCheckIcon /> Admins
            </button>
          </div>
        </div>

        {/* Connected users */}
        <div style={s.sideSection}>
          <div style={s.sideSectionTitle}>
            <SendIcon />
            CONNECTED USERS
            <span style={s.countBadge}>{guestCount + 1}</span>
          </div>
          {/* Host (you) */}
          <div style={s.userRow}>
            <div style={s.userAvatar}>🔥</div>
            <span style={s.userName}>{nick}</span>
            <span style={s.youBadge}>You</span>
          </div>
          {/* Guest count */}
          {guestCount > 0 && (
            <div style={{ fontSize: 11, color: '#444458', marginTop: 5, paddingLeft: 6 }}>
              + {guestCount} гостей подключено
            </div>
          )}
        </div>

        {/* Tips */}
        <div style={s.tips}>
          <div style={s.tipsTitle}>Tips</div>
          <p style={s.tipText}>• Поиск работает через iTunes API без токенов</p>
          <p style={s.tipText}>• Очередь сортируется по лайкам автоматически</p>
          <p style={s.tipText}>• Поделись QR-кодом — гости войдут без регистрации</p>
        </div>

        <div style={{ flex: 1 }} />

        <button
          style={s.backBtn}
          onClick={() => nav('/')}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = '#8888a0')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = '#444458')}
        >
          ← На главную
        </button>
      </aside>

      {/* ════════════════ CENTER ════════════════ */}
      <main style={s.center}>
        {/* Search */}
        <div style={s.searchWrap}>
          <MagnifyIcon />
          <input
            style={s.searchInput}
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchRes.length > 0 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
            placeholder="What do you want to play?"
            autoComplete="off"
          />
          {searching && <span style={{ color: '#555568', fontSize: 12 }}>⏳</span>}
          <kbd style={s.kbd}>⌘K</kbd>

          {searchOpen && searchRes.length > 0 && (
            <div style={s.dropdown}>
              {searchRes.slice(0, 6).map(t => (
                <div key={t.trackId} style={s.dropItem} onMouseDown={() => addTrack(t)}>
                  <img src={t.artworkUrl100} alt="" style={s.dropThumb}
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.dropName}>{t.trackName}</div>
                    <div style={s.dropArtist}>{t.artistName}</div>
                  </div>
                  <span style={s.dropDur}>{fmt(Math.round(t.trackTimeMillis / 1000))}</span>
                  <button className="btn-fire" style={{ padding: '5px 14px', fontSize: 11 }}>
                    + Добавить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue label */}
        <div style={s.queueMeta}>
          <span style={s.betaTag}>[ EXPERIMENTAL FREE BETA ]</span>
        </div>

        {/* Queue */}
        <div style={s.queueList}>
          {sortedQueue.length === 0 ? (
            <div style={s.emptyQ}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎶</div>
              <div style={{ color: '#555568', fontSize: 13 }}>Очередь пуста — ищи трек выше</div>
            </div>
          ) : sortedQueue.map((track, i) => (
            <QueueRow
              key={track.queueId}
              track={track}
              index={i}
              isPlaying={currentTrack?.queueId === track.queueId && playback.isPlaying}
              liked={likedIds.has(track.queueId)}
              onVote={() => {}}
              onRemove={() => {
                actions.removeTrack(track.queueId)
                showToast('Трек удалён', 'info')
              }}
            />
          ))}
        </div>
      </main>

      {/* ════════════════ RIGHT SIDEBAR ════════════════ */}
      <aside style={s.rightBar}>
        <div style={s.rightTabs}>
          <button style={{ ...s.tabBtn, ...s.tabActive }}>
            <ChatDotIcon /> Chat
          </button>
          <button style={s.tabBtn} onClick={() => setShowQR(true)}>
            <QrIconSm /> Spatial
          </button>
        </div>
        <div style={s.rightBody}>
          <ChatBubbleBig />
          <div style={{ color: '#555568', fontSize: 13, marginTop: 8 }}>No messages yet</div>
          <div style={{ color: '#333344', fontSize: 11, marginTop: 4 }}>Start the conversation</div>
        </div>
        <div style={s.rightFoot}>
          <input style={s.msgInput} placeholder="Message" disabled />
        </div>
      </aside>

      {/* ════════════════ BOTTOM PLAYER BAR ════════════════ */}
      <div style={s.bar}>
        {/* Left: track info */}
        <div style={s.barLeft}>
          {currentTrack ? (
            <>
              <img src={currentTrack.info.image} alt="" style={s.barCover}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }} />
              <div style={{ minWidth: 0 }}>
                <div style={s.barTrack}>
                  {currentTrack.info.artist} — {currentTrack.info.title}
                </div>
                <div style={s.barAlbum}>{fmt(playback.currentTime)} / {fmt(duration)}</div>
              </div>
            </>
          ) : (
            <div style={{ color: '#444458', fontSize: 12 }}>Нет трека</div>
          )}
        </div>

        {/* Center: controls + progress */}
        <div style={s.barCenter}>
          <div style={s.barControls}>
            <button style={s.barBtn} title="Shuffle" onClick={() => actions.playbackControl('shuffle')}>
              <ShuffleIco />
            </button>
            <button style={s.barBtn} title="Prev" onClick={() => actions.playbackControl('prev')}>
              <PrevIco />
            </button>
            <button style={s.playBtn} onClick={() => actions.playbackControl(playback.isPlaying ? 'pause' : 'play')}>
              {playback.isPlaying ? <PauseIco /> : <PlayIco />}
            </button>
            <button style={s.barBtn} title="Next" onClick={() => actions.playbackControl('next')}>
              <NextIco />
            </button>
            <button style={s.barBtn} title="Skip vote" onClick={() => actions.skipVote(true)}>
              <RepeatIco />
            </button>
          </div>
          <div style={s.progRow}>
            <span style={s.progTime}>{fmt(playback.currentTime)}</span>
            <div style={s.progBar} onClick={seekTo}>
              <div style={{ ...s.progFill, width: `${progress}%` }} />
            </div>
            <span style={s.progTime}>{fmt(duration)}</span>
          </div>
        </div>

        {/* Right: volume */}
        <div style={s.barRight}>
          <VolumeIco />
          <input
            type="range" min={0} max={1} step={0.01}
            value={playback.volume}
            style={s.volSlider}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (audioRef.current) audioRef.current.volume = v
              actions.playbackControl('volume', v)
            }}
          />
        </div>
      </div>

      {/* QR Share Modal */}
      {showQR && <QRShareModal roomId={roomId} url={roomUrl} onClose={() => setShowQR(false)} />}
    </div>
  )
}

// ── Queue Row Component ────────────────────────────────────────────────────
interface QRowProps {
  track: Track
  index: number
  isPlaying: boolean
  liked: boolean
  onVote: () => void
  onRemove: () => void
}

function QueueRow({ track, index, isPlaying, liked, onVote, onRemove }: QRowProps) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        ...rs.row,
        background: hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: isPlaying ? '2px solid #f97316' : '2px solid transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span style={rs.drag}>⠿</span>
      <span style={rs.num}>
        {isPlaying
          ? <span style={{ color: '#f97316' }}>▶</span>
          : <span style={{ color: '#444458' }}>{index + 1}</span>}
      </span>
      <div style={rs.info}>
        <span style={{ color: isPlaying ? '#f97316' : '#d0d0e0', fontWeight: 500, fontSize: 13 }}>
          {track.info.artist} — {track.info.title}
        </span>
      </div>
      <div style={rs.votes}>
        <button
          style={{ ...rs.likeBtn, color: liked || track.votes > 0 ? '#f97316' : '#444458' }}
          onClick={onVote}
        >
          ♥ {track.votes > 0 ? track.votes : ''}
        </button>
      </div>
      <span style={rs.dur}>{track.info.duration ? `${Math.floor(track.info.duration / 60)}:${String(track.info.duration % 60).padStart(2, '0')}` : '--:--'}</span>
      {hov && (
        <button style={rs.del} onClick={onRemove} title="Удалить">‒</button>
      )}
    </div>
  )
}

const rs: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px 9px 12px',
    borderRadius: 5,
    marginBottom: 1,
    transition: 'background 0.12s',
    cursor: 'default',
  },
  drag: { color: '#2a2a3a', fontSize: 14, cursor: 'grab', flexShrink: 0 },
  num: { width: 22, textAlign: 'center', flexShrink: 0, fontSize: 12 },
  info: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  votes: { display: 'flex', alignItems: 'center' },
  likeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
    fontFamily: "'Montserrat', sans-serif",
    transition: 'color 0.2s',
  },
  dur: { fontSize: 11, color: '#444458', fontWeight: 600, width: 40, textAlign: 'right', flexShrink: 0 },
  del: {
    background: 'none', border: 'none',
    color: '#555568', cursor: 'pointer', fontSize: 18, fontWeight: 700,
    padding: '0 6px', borderRadius: 4, flexShrink: 0,
    lineHeight: 1,
  },
}

// ── Layout styles ──────────────────────────────────────────────────────────
const BAR = 84

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh',
    background: '#0c0c0f', overflow: 'hidden',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Sidebar left
  sidebar: {
    width: 260, flexShrink: 0,
    background: '#0e0e13',
    borderRight: '1px solid rgba(255,255,255,0.055)',
    display: 'flex', flexDirection: 'column',
    paddingBottom: BAR, overflow: 'hidden',
  },
  sideHeader: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
    flexShrink: 0,
  },
  sidebarLogo: { width: 28, height: 'auto', filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))', flexShrink: 0 },
  roomIdLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 15, letterSpacing: '0.08em', color: '#f0f0f5',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  qrBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 6, color: '#8888a0',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '5px 9px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
    transition: 'color 0.2s, border-color 0.2s',
  },
  sideSection: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sideSectionTitle: {
    fontSize: 9, fontWeight: 700, color: '#444458', letterSpacing: '0.12em',
    marginBottom: 9, display: 'flex', alignItems: 'center', gap: 5,
  },
  permRow: { display: 'flex', gap: 5 },
  permBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 7, color: '#8888a0',
    fontSize: 11, fontWeight: 600, padding: '8px 6px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    transition: 'all 0.2s',
  },
  permActive: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.22)',
    color: '#22c55e',
  },
  countBadge: {
    background: '#1a1a22',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4, color: '#8888a0',
    fontSize: 10, fontWeight: 700, padding: '1px 6px', marginLeft: 2,
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 8px', borderRadius: 8,
    background: 'rgba(255,255,255,0.025)',
  },
  userAvatar: {
    width: 28, height: 28,
    background: '#1a1a22',
    border: '2px solid rgba(249,115,22,0.6)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0,
  },
  userName: {
    flex: 1, fontSize: 12, fontWeight: 600, color: '#c0c0d0',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  youBadge: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.22)',
    borderRadius: 6, color: '#22c55e',
    fontSize: 10, fontWeight: 700, padding: '2px 8px', flexShrink: 0,
  },
  tips: { padding: '13px 16px', flex: 0 },
  tipsTitle: { fontSize: 9, fontWeight: 700, color: '#444458', letterSpacing: '0.1em', marginBottom: 8 },
  tipText: { fontSize: 11, color: '#333348', marginBottom: 5, lineHeight: 1.5 },
  backBtn: {
    background: 'none', border: 'none',
    color: '#444458', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', padding: '12px 16px', textAlign: 'left',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    transition: 'color 0.2s',
  },

  // Center
  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    overflow: 'hidden', paddingBottom: BAR,
  },
  searchWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '11px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1, background: 'none', border: 'none',
    color: '#f0f0f5', fontSize: 14, outline: 'none',
    fontFamily: "'Montserrat', sans-serif",
  },
  kbd: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 5, color: '#444458',
    fontSize: 11, padding: '2px 6px', flexShrink: 0,
  },
  dropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: '#141418',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0 0 10px 10px',
    zIndex: 50, overflow: 'hidden',
    boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer', transition: 'background 0.12s',
  },
  dropThumb: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#0c0c0f', flexShrink: 0 },
  dropName: { fontSize: 13, fontWeight: 700, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dropArtist: { fontSize: 11, color: '#8888a0', marginTop: 2 },
  dropDur: { fontSize: 11, color: '#444458', fontWeight: 600, flexShrink: 0 },
  queueMeta: { padding: '9px 20px', flexShrink: 0 },
  betaTag: { fontSize: 10, color: '#444458', fontWeight: 600, letterSpacing: '0.06em' },
  queueList: { flex: 1, overflowY: 'auto', padding: '0 10px 10px' },
  emptyQ: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px', color: '#555568',
  },

  // Right sidebar
  rightBar: {
    width: 280, flexShrink: 0,
    background: '#0e0e13',
    borderLeft: '1px solid rgba(255,255,255,0.055)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', paddingBottom: BAR,
  },
  rightTabs: {
    display: 'flex', padding: '8px',
    borderBottom: '1px solid rgba(255,255,255,0.055)',
    gap: 4, flexShrink: 0,
  },
  tabBtn: {
    flex: 1, background: 'none', border: 'none',
    color: '#555568', fontSize: 12, fontWeight: 700,
    padding: '8px 10px', cursor: 'pointer', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.2s',
  },
  tabActive: { background: 'rgba(255,255,255,0.06)', color: '#f0f0f5' },
  rightBody: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'auto',
  },
  rightFoot: {
    padding: '10px', borderTop: '1px solid rgba(255,255,255,0.055)', flexShrink: 0,
  },
  msgInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '10px 14px',
    color: '#555568', fontSize: 13, outline: 'none',
    cursor: 'not-allowed',
    fontFamily: "'Montserrat', sans-serif",
  },

  // Bottom bar
  bar: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: BAR,
    background: '#111117',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: 20, zIndex: 100,
  },
  barLeft: {
    width: 240, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden',
  },
  barCover: {
    width: 46, height: 46, borderRadius: 7, objectFit: 'cover',
    background: '#1a1a22', flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  barTrack: {
    fontSize: 12, fontWeight: 700, color: '#d0d0e0',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  barAlbum: { fontSize: 10, color: '#555568', marginTop: 2 },
  barCenter: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  barControls: { display: 'flex', alignItems: 'center', gap: 16 },
  barBtn: {
    background: 'none', border: 'none',
    color: '#8888a0', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    padding: 4, borderRadius: '50%', transition: 'color 0.2s',
  },
  playBtn: {
    background: '#f0f0f5', border: 'none', borderRadius: '50%',
    width: 34, height: 34,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#0c0c0f', transition: 'opacity 0.15s, transform 0.1s',
  },
  progRow: { display: 'flex', alignItems: 'center', gap: 9, width: '100%' },
  progTime: { fontSize: 10, color: '#444458', fontWeight: 600, flexShrink: 0 },
  progBar: {
    flex: 1, height: 3,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2, cursor: 'pointer', overflow: 'hidden',
  },
  progFill: {
    height: '100%', background: '#f0f0f5',
    borderRadius: 2, transition: 'width 1s linear',
  },
  barRight: {
    width: 140, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 9, color: '#8888a0',
  },
  volSlider: {
    flex: 1, WebkitAppearance: 'none',
    height: 3, background: 'rgba(255,255,255,0.12)',
    borderRadius: 2, outline: 'none', cursor: 'pointer',
  },
}

// ── Icons ──────────────────────────────────────────────────────────────────
const SVG = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' }

function MagnifyIcon()    { return <svg {...SVG} width={17} height={17}><circle cx={11} cy={11} r={8}/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg> }
function QrIconSm()       { return <svg {...SVG} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h4v4h-4zM15.5 4.5h4v4h-4zM4.5 15.5h4v4h-4zM15.5 15.5h2v2M19.5 17.5v2M17.5 19.5h2"/></svg> }
function PlayTriangle()   { return <svg fill="currentColor" width={9} height={9} viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
function UserGroupIcon()  { return <svg {...SVG} width={11} height={11}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function ShieldCheckIcon() { return <svg {...SVG} width={11} height={11}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> }
function SendIcon()       { return <svg {...SVG} width={10} height={10}><line x1={22} y1={2} x2={11} y2={13}/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
function ChatDotIcon()    { return <svg {...SVG} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }
function ChatBubbleBig()  { return <svg width={36} height={36} fill="none" viewBox="0 0 24 24" stroke="#2a2a3e" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }

const Bic = { width: 17, height: 17, fill: 'currentColor', viewBox: '0 0 24 24' }
function ShuffleIco() { return <svg {...Bic} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg> }
function PrevIco()    { return <svg {...Bic}><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg> }
function NextIco()    { return <svg {...Bic}><path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/></svg> }
function PlayIco()    { return <svg width={15} height={15} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> }
function PauseIco()   { return <svg width={15} height={15} fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> }
function RepeatIco()  { return <svg {...Bic} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3"/></svg> }
function VolumeIco()  { return <svg width={15} height={15} fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg> }

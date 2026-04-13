import React, { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRoomContext } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import type { RoomActions } from '../hooks/useRoom'
import type { Track } from '../context/RoomContext'
import QRShareModal from './QRShareModal'
import logo from '/logo.png'

interface Props {
  roomId: string
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

function saveLocal(track: Track) {
  try {
    const saved: Track[] = JSON.parse(localStorage.getItem('tt_saved') || '[]')
    if (!saved.find(t => t.info.id === track.info.id)) {
      localStorage.setItem('tt_saved', JSON.stringify([...saved, track]))
    }
  } catch {}
}

export default function GuestView({ roomId, clientId, actions }: Props) {
  const nav = useNavigate()
  const { queue, currentTrack, playback, guestCount } = useRoomContext()
  const { showToast } = useToast()

  const [showQR, setShowQR] = useState(false)
  const [likedIds, setLikedIds] = useState(new Set<string>())
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState<ItunesResult[]>([])
  const [searching, setSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const roomUrl = `${location.origin}/room/${roomId}`
  const nick = localStorage.getItem('tt_nick') || clientId.slice(0, 8)
  const duration = currentTrack?.info.duration || 1
  const progress = Math.min((playback.currentTime / duration) * 100, 100)

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

  const handleVote = useCallback((queueId: string, value: boolean) => {
    actions.vote(queueId, value)
    setLikedIds(prev => {
      const next = new Set(prev)
      value ? next.add(queueId) : next.delete(queueId)
      return next
    })
    showToast(value ? '♥ Лайк поставлен' : 'Лайк убран', value ? 'success' : 'info')
  }, [actions, showToast])

  const handleSave = useCallback((track: Track) => {
    saveLocal(track)
    showToast(`Сохранено: ${track.info.title}`, 'success')
  }, [showToast])

  const sortedQueue = [...queue].sort((a, b) => b.votes - a.votes)

  return (
    <div style={s.root}>

      {/* ════════ LEFT SIDEBAR ════════ */}
      <aside style={s.sidebar}>
        <div style={s.sideHeader}>
          <img src={logo} alt="" style={s.logo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.roomLabel}># {roomId.toUpperCase()}</div>
            <div style={s.nickLabel}>{nick}</div>
          </div>
          <button style={s.qrBtn} onClick={() => setShowQR(true)}>
            <QrIco /> QR
          </button>
        </div>

        {/* Now playing mini */}
        <div style={s.sideSection}>
          <div style={s.secTitle}><LiveDot /> СЕЙЧАС ИГРАЕТ</div>
          {currentTrack ? (
            <div style={s.nowRow}>
              <img src={currentTrack.info.image} alt="" style={s.nowCover}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.nowTitle}>{currentTrack.info.title}</div>
                <div style={s.nowArtist}>{currentTrack.info.artist}</div>
                {/* Мини прогресс */}
                <div style={s.miniProg}>
                  <div style={{ ...s.miniProgFill, width: `${progress}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span style={s.nowTime}>{fmt(playback.currentTime)}</span>
                  <span style={s.nowTime}>{fmt(duration)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#444458', fontSize: 12, padding: '4px 0' }}>Трек не выбран</div>
          )}
        </div>

        {/* Connected users */}
        <div style={s.sideSection}>
          <div style={s.secTitle}>
            <PeopleIco />
            УЧАСТНИКИ
            <span style={s.cnt}>{guestCount + 1}</span>
          </div>
          <div style={s.userRow}>
            <div style={s.avatar}>🔥</div>
            <span style={s.uName}>{nick}</span>
            <span style={s.youTag}>You</span>
          </div>
          {guestCount > 0 && (
            <div style={{ fontSize: 11, color: '#333348', marginTop: 5, paddingLeft: 4 }}>
              + {guestCount} гостей
            </div>
          )}
        </div>

        {/* Skip + save links */}
        <div style={s.sideSection}>
          <button
            className="btn-outline-fire"
            style={{ width: '100%', padding: '9px 12px', fontSize: 12, marginBottom: 8 }}
            onClick={() => { actions.skipVote(true); showToast('Голос за скип отправлен', 'info') }}
          >
            ⏭ Голос за скип
          </button>
          <button
            className="btn-outline-fire"
            style={{ width: '100%', padding: '9px 12px', fontSize: 12, borderColor: 'rgba(255,255,255,0.08)', color: '#8888a0' }}
            onClick={() => nav('/saved')}
          >
            💾 Сохранённые треки
          </button>
        </div>

        <div style={{ flex: 1 }} />
        <button style={s.backBtn} onClick={() => nav('/')}>← Выйти</button>
      </aside>

      {/* ════════ CENTER — SEARCH + QUEUE ════════ */}
      <main style={s.center}>
        {/* Search */}
        <div style={s.searchWrap}>
          <MagIco />
          <input
            style={s.searchInput}
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => searchRes.length > 0 && setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 180)}
            placeholder="What do you want to play?"
            autoComplete="off"
          />
          {searching && <span style={{ color: '#555568', fontSize: 11 }}>⏳</span>}
          <kbd style={s.kbd}>⌘K</kbd>

          {searchOpen && searchRes.length > 0 && (
            <div style={s.drop}>
              {searchRes.slice(0, 6).map(t => (
                <div key={t.trackId} style={s.dropItem} onMouseDown={() => addTrack(t)}>
                  <img src={t.artworkUrl100} alt="" style={s.dropThumb}
                    onError={e => { (e.target as HTMLImageElement).style.opacity = '0' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={s.dropName}>{t.trackName}</div>
                    <div style={s.dropArt}>{t.artistName}</div>
                  </div>
                  <span style={s.dropDur}>{fmt(Math.round(t.trackTimeMillis / 1000))}</span>
                  <button className="btn-fire" style={{ padding: '5px 12px', fontSize: 11 }}>
                    + Добавить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={s.qMeta}>
          <span style={s.betaTag}>[ EXPERIMENTAL FREE BETA ]</span>
          <span style={{ color: '#444458', fontSize: 10, fontWeight: 600 }}>
            {sortedQueue.length} треков
          </span>
        </div>

        {/* Queue list */}
        <div style={s.qList}>
          {sortedQueue.length === 0 ? (
            <div style={s.emptyQ}>
              <div style={{ fontSize: 38, marginBottom: 12 }}>🎶</div>
              <div style={{ color: '#555568', fontSize: 13 }}>Очередь пуста — добавь первый трек!</div>
            </div>
          ) : sortedQueue.map((track, i) => (
            <GuestQueueRow
              key={track.queueId}
              track={track}
              index={i}
              isPlaying={currentTrack?.queueId === track.queueId && playback.isPlaying}
              liked={likedIds.has(track.queueId)}
              onVote={(v) => handleVote(track.queueId, v)}
              onSave={() => handleSave(track)}
            />
          ))}
        </div>
      </main>

      {/* ════════ RIGHT SIDEBAR — CHAT ════════ */}
      <aside style={s.rightBar}>
        <div style={s.rightTabs}>
          <button style={{ ...s.tabBtn, ...s.tabActive }}>
            <ChatIco /> Chat
          </button>
          <button style={s.tabBtn} onClick={() => setShowQR(true)}>
            <QrIco /> QR
          </button>
        </div>
        <div style={s.rightBody}>
          <ChatBubble />
          <div style={{ color: '#555568', fontSize: 13, marginTop: 8 }}>No messages yet</div>
          <div style={{ color: '#2a2a3e', fontSize: 11, marginTop: 4 }}>Start the conversation</div>
        </div>
        <div style={s.rightFoot}>
          <input style={s.msgInput} placeholder="Message" disabled />
        </div>
      </aside>

      {/* ════════ BOTTOM STATUS BAR ════════ */}
      <div style={s.bar}>
        <div style={s.barLeft}>
          {currentTrack ? (
            <>
              <img src={currentTrack.info.image} alt="" style={s.barCover}
                onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2' }} />
              <div style={{ minWidth: 0 }}>
                <div style={s.barTrack}>{currentTrack.info.artist} — {currentTrack.info.title}</div>
                <div style={s.barSub}>Хост управляет воспроизведением</div>
              </div>
            </>
          ) : (
            <div style={{ color: '#444458', fontSize: 12 }}>Нет трека</div>
          )}
        </div>
        <div style={s.barCenter}>
          <div style={s.barProgRow}>
            <span style={s.barTime}>{fmt(playback.currentTime)}</span>
            <div style={s.barProg}>
              <div style={{ ...s.barProgFill, width: `${progress}%` }} />
            </div>
            <span style={s.barTime}>{fmt(duration)}</span>
          </div>
          <div style={{ fontSize: 10, color: '#444458', fontWeight: 600, letterSpacing: '0.06em' }}>
            {playback.isPlaying ? '▶ ВОСПРОИЗВЕДЕНИЕ' : '⏸ ПАУЗА'}
          </div>
        </div>
        <div style={s.barRight}>
          <div style={s.liveChip}>
            <span style={s.liveDot} />
            LIVE
          </div>
          <span style={{ color: '#555568', fontSize: 11, fontWeight: 600 }}>
            {guestCount + 1} онлайн
          </span>
        </div>
      </div>

      {showQR && <QRShareModal roomId={roomId} url={roomUrl} onClose={() => setShowQR(false)} />}
    </div>
  )
}

// ── Guest Queue Row ────────────────────────────────────────────────────────
interface GRowProps {
  track: Track
  index: number
  isPlaying: boolean
  liked: boolean
  onVote: (v: boolean) => void
  onSave: () => void
}

function GuestQueueRow({ track, index, isPlaying, liked, onVote, onSave }: GRowProps) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        ...gr.row,
        background: hov ? 'rgba(255,255,255,0.03)' : 'transparent',
        borderLeft: isPlaying ? '2px solid #f97316' : '2px solid transparent',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <span style={gr.num}>
        {isPlaying
          ? <span style={{ color: '#f97316' }}>▶</span>
          : <span style={{ color: '#444458' }}>{index + 1}</span>}
      </span>
      <div style={gr.info}>
        <span style={{ color: isPlaying ? '#f97316' : '#d0d0e0', fontWeight: 500, fontSize: 13 }}>
          {track.info.artist} — {track.info.title}
        </span>
      </div>
      {/* Like */}
      <button
        style={{
          ...gr.likeBtn,
          color: liked ? '#f97316' : '#555568',
          background: liked ? 'rgba(249,115,22,0.1)' : 'none',
        }}
        onClick={() => onVote(!liked)}
        title={liked ? 'Убрать лайк' : 'Лайк'}
      >
        {liked ? '♥' : '♡'} {track.votes > 0 ? track.votes : ''}
      </button>
      {/* Duration */}
      <span style={gr.dur}>
        {track.info.duration ? fmt(track.info.duration) : '--:--'}
      </span>
      {/* Save */}
      {hov && (
        <button style={gr.saveBtn} onClick={onSave} title="Сохранить">
          <SaveIco />
        </button>
      )}
    </div>
  )
}

const gr: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 14px 9px 12px',
    borderRadius: 5, marginBottom: 1,
    transition: 'background 0.12s', cursor: 'default',
  },
  num: { width: 22, textAlign: 'center', flexShrink: 0, fontSize: 12 },
  info: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  likeBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, padding: '4px 9px', borderRadius: 6,
    transition: 'color 0.2s, background 0.2s',
    fontFamily: "'Montserrat', sans-serif",
    flexShrink: 0,
  },
  dur: { fontSize: 11, color: '#444458', fontWeight: 600, width: 40, textAlign: 'right', flexShrink: 0 },
  saveBtn: {
    background: 'none', border: 'none', color: '#555568',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    padding: '4px', borderRadius: 4, transition: 'color 0.2s', flexShrink: 0,
  },
}

const BAR = 80

const s: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', height: '100vh',
    background: '#0c0c0f', overflow: 'hidden',
    fontFamily: "'Montserrat', sans-serif",
  },
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
  logo: { width: 28, height: 'auto', filter: 'drop-shadow(0 0 8px rgba(249,115,22,0.5))', flexShrink: 0 },
  roomLabel: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 15, letterSpacing: '0.08em', color: '#f0f0f5',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  nickLabel: { fontSize: 10, color: '#444458', fontWeight: 500, marginTop: 1 },
  qrBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 6, color: '#8888a0',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
    padding: '5px 9px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
  },
  sideSection: {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  secTitle: {
    fontSize: 9, fontWeight: 700, color: '#444458', letterSpacing: '0.12em',
    marginBottom: 9, display: 'flex', alignItems: 'center', gap: 5,
  },
  cnt: {
    background: '#1a1a22', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 4, color: '#8888a0',
    fontSize: 10, fontWeight: 700, padding: '1px 5px',
  },
  nowRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  nowCover: { width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#1a1a22', flexShrink: 0, border: '1px solid rgba(255,255,255,0.07)' },
  nowTitle: { fontSize: 12, fontWeight: 700, color: '#d0d0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 },
  nowArtist: { fontSize: 10, color: '#8888a0', marginBottom: 6 },
  miniProg: { height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden' },
  miniProgFill: { height: '100%', background: '#f97316', borderRadius: 1, transition: 'width 1s linear' },
  nowTime: { fontSize: 9, color: '#444458', fontWeight: 600 },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '6px 8px', borderRadius: 8,
    background: 'rgba(255,255,255,0.025)',
  },
  avatar: {
    width: 28, height: 28,
    background: '#1a1a22',
    border: '2px solid rgba(249,115,22,0.6)',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, flexShrink: 0,
  },
  uName: { flex: 1, fontSize: 12, fontWeight: 600, color: '#c0c0d0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  youTag: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.22)',
    borderRadius: 6, color: '#22c55e',
    fontSize: 10, fontWeight: 700, padding: '2px 8px', flexShrink: 0,
  },
  backBtn: {
    background: 'none', border: 'none',
    color: '#444458', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', padding: '12px 16px', textAlign: 'left',
    borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'color 0.2s',
  },

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
    borderRadius: 5, color: '#444458', fontSize: 11, padding: '2px 6px', flexShrink: 0,
  },
  drop: {
    position: 'absolute', top: '100%', left: 0, right: 0,
    background: '#141418', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '0 0 10px 10px',
    zIndex: 50, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    cursor: 'pointer', transition: 'background 0.12s',
  },
  dropThumb: { width: 36, height: 36, borderRadius: 6, objectFit: 'cover', background: '#0c0c0f', flexShrink: 0 },
  dropName: { fontSize: 13, fontWeight: 700, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  dropArt: { fontSize: 11, color: '#8888a0', marginTop: 2 },
  dropDur: { fontSize: 11, color: '#444458', fontWeight: 600, flexShrink: 0 },
  qMeta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '9px 20px', flexShrink: 0,
  },
  betaTag: { fontSize: 10, color: '#444458', fontWeight: 600, letterSpacing: '0.06em' },
  qList: { flex: 1, overflowY: 'auto', padding: '0 10px 10px' },
  emptyQ: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '80px 20px', color: '#555568',
  },

  rightBar: {
    width: 280, flexShrink: 0,
    background: '#0e0e13',
    borderLeft: '1px solid rgba(255,255,255,0.055)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden', paddingBottom: BAR,
  },
  rightTabs: {
    display: 'flex', padding: '8px', gap: 4,
    borderBottom: '1px solid rgba(255,255,255,0.055)', flexShrink: 0,
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
    alignItems: 'center', justifyContent: 'center', overflow: 'auto',
  },
  rightFoot: { padding: '10px', borderTop: '1px solid rgba(255,255,255,0.055)', flexShrink: 0 },
  msgInput: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 8, padding: '10px 14px',
    color: '#555568', fontSize: 13, outline: 'none',
    cursor: 'not-allowed', fontFamily: "'Montserrat', sans-serif",
  },

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
    width: 44, height: 44, borderRadius: 7, objectFit: 'cover',
    background: '#1a1a22', flexShrink: 0,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  barTrack: { fontSize: 12, fontWeight: 700, color: '#d0d0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barSub: { fontSize: 10, color: '#444458', marginTop: 2 },
  barCenter: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
  },
  barProgRow: { display: 'flex', alignItems: 'center', gap: 9, width: '100%' },
  barTime: { fontSize: 10, color: '#444458', fontWeight: 600, flexShrink: 0 },
  barProg: { flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' },
  barProgFill: { height: '100%', background: '#f97316', borderRadius: 2, transition: 'width 1s linear' },
  barRight: {
    width: 160, flexShrink: 0,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  liveChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(249,115,22,0.08)',
    border: '1px solid rgba(249,115,22,0.2)',
    borderRadius: 6, padding: '4px 9px',
    fontSize: 10, fontWeight: 700, color: '#f97316', letterSpacing: '0.08em',
  },
  liveDot: {
    width: 6, height: 6, background: '#f97316', borderRadius: '50%',
    display: 'inline-block', animation: 'pulse 1.5s infinite',
  },
}

// ── Icons ──────────────────────────────────────────────────────────────────
const SV = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, viewBox: '0 0 24 24' }
function MagIco()    { return <svg {...SV} width={17} height={17}><circle cx={11} cy={11} r={8}/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg> }
function QrIco()     { return <svg {...SV} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h4v4h-4zM15.5 4.5h4v4h-4zM4.5 15.5h4v4h-4zM15.5 15.5h2v2M19.5 17.5v2M17.5 19.5h2"/></svg> }
function PeopleIco() { return <svg {...SV} width={11} height={11}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> }
function ChatIco()   { return <svg {...SV} width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }
function ChatBubble() { return <svg width={36} height={36} fill="none" viewBox="0 0 24 24" stroke="#2a2a3e" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> }
function LiveDot()   { return <span style={{ width: 7, height: 7, background: '#f97316', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} /> }
function SaveIco()   { return <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width={13} height={13}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg> }

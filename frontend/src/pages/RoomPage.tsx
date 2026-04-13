import React, { useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useRoomContext } from '../context/RoomContext'
import { useRoom } from '../hooks/useRoom'
import { getRoom } from '../services/api'
import HostView from '../components/HostView'
import GuestView from '../components/GuestView'
import SkipModal from '../components/SkipModal'

// ── clientId – генерируется 1 раз и живёт в localStorage ──────────────────
function getOrCreateClientId(): string {
  let id = localStorage.getItem('tt_clientId')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('tt_clientId', id)
  }
  return id
}

// ── Component ──────────────────────────────────────────────────────────────
export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [params] = useSearchParams()

  const isHost    = params.get('host') === '1'
  const hostToken = params.get('token') ?? undefined
  const clientId  = getOrCreateClientId()

  const { dispatch, skipState } = useRoomContext()
  const actions = useRoom({
    roomId:    roomId!,
    clientId,
    hostToken: isHost ? hostToken : undefined,
  })

  // Загружаем начальное состояние через REST (на случай если WS ещё не подключился)
  useEffect(() => {
    getRoom(roomId!)
      .then(state =>
        dispatch({
          type: 'SET_ALL',
          payload: {
            queue:        state.queue,
            currentTrack: state.currentTrack,
            playback:     state.playback,
            guestCount:   state.guestCount,
          },
        })
      )
      .catch(() => {
        // Комната не найдена – WS тоже вернёт ошибку, ничего не делаем
      })
  }, [roomId])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {isHost
        ? <HostView roomId={roomId!} hostToken={hostToken!} clientId={clientId} actions={actions} />
        : <GuestView roomId={roomId!} clientId={clientId} actions={actions} />
      }

      {/* Модалка скипа – появляется у всех при голосовании */}
      {skipState && (
        <SkipModal skipState={skipState} onVote={actions.skipVote} />
      )}
    </div>
  )
}

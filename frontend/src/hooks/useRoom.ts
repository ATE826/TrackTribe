import { useCallback } from 'react'
import { useWebSocket } from './useWebSocket'
import { useRoomContext } from '../context/RoomContext'
import { useToast } from '../context/ToastContext'
import type { TrackInfo } from '../context/RoomContext'

interface UseRoomOptions {
  roomId: string
  clientId: string
  hostToken?: string
}

export function useRoom({ roomId, clientId, hostToken }: UseRoomOptions) {
  const { dispatch } = useRoomContext()
  const { showToast } = useToast()

  // Строим URL WebSocket
  const wsUrl = (() => {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const params = new URLSearchParams({ roomId, clientId })
    if (hostToken) params.set('token', hostToken)
    return `${proto}://${location.host}/ws?${params}`
  })()

  const { send } = useWebSocket(wsUrl, (msg) => {
    switch (msg.type) {

      case 'room_state': {
        const p = msg.payload as any
        dispatch({
          type: 'SET_ALL',
          payload: {
            queue: p.queue ?? [],
            currentTrack: p.currentTrack ?? null,
            playback: p.playback,
            guestCount: p.guestCount ?? 0,
          },
        })
        break
      }

      case 'queue_updated':
        dispatch({ type: 'SET_QUEUE', payload: (msg.payload as any).queue })
        break

      case 'track_changed':
        dispatch({ type: 'SET_TRACK', payload: (msg.payload as any).track })
        showToast('Трек сменился ♪', 'info')
        break

      case 'playback_state':
        dispatch({ type: 'SET_PLAYBACK', payload: msg.payload as any })
        break

      case 'skip_progress':
        dispatch({ type: 'SET_SKIP', payload: msg.payload as any })
        break

      case 'skip_completed':
        dispatch({ type: 'SET_SKIP', payload: null })
        showToast('Трек пропущен', 'info')
        break

      case 'guest_count':
        dispatch({ type: 'SET_GUESTS', payload: (msg.payload as any).count })
        break

      case 'error':
        showToast((msg.payload as any).message ?? 'Ошибка', 'error')
        break
    }
  })

  // ── Действия клиента ───────────────────────────────────────────────────
  const addTrack = useCallback((info: TrackInfo) => {
    send('add_track', info)
    showToast(`Добавлен: ${info.title}`, 'success')
  }, [send, showToast])

  const vote = useCallback((queueId: string, value: boolean) => {
    send('vote', { queueId, value })
  }, [send])

  const removeTrack = useCallback((queueId: string) => {
    send('remove_track', { queueId })
    showToast('Трек удалён', 'info')
  }, [send, showToast])

  const skipVote = useCallback((agree: boolean) => {
    send('skip_vote', { agree })
  }, [send])

  const playbackControl = useCallback((action: string, value?: number) => {
    send('playback_control', { action, value: value ?? 0 })
  }, [send])

  // Хост периодически шлёт текущую позицию для синхронизации гостей
  const updatePlayback = useCallback((currentTime: number, isPlaying: boolean) => {
    send('update_playback', { currentTime, isPlaying })
  }, [send])

  return { addTrack, vote, removeTrack, skipVote, playbackControl, updatePlayback }
}

export type RoomActions = ReturnType<typeof useRoom>

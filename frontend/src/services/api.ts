import type { Track, PlaybackState } from '../context/RoomContext'

const BASE = '/api'

// ── Response types ─────────────────────────────────────────────────────────
export interface RoomCreated {
  roomId: string
  hostToken: string
}

export interface RoomStateResponse {
  roomId: string
  queue: Track[]
  currentTrack: Track | null
  playback: PlaybackState
  guestCount: number
}

// ── API calls ──────────────────────────────────────────────────────────────
export async function createRoom(): Promise<RoomCreated> {
  const res = await fetch(`${BASE}/rooms`, { method: 'POST' })
  if (!res.ok) throw new Error('Не удалось создать комнату')
  return res.json()
}

export async function getRoom(roomId: string): Promise<RoomStateResponse> {
  const res = await fetch(`${BASE}/rooms/${roomId}`)
  if (!res.ok) throw new Error('Комната не найдена')
  return res.json()
}

export async function deleteRoom(roomId: string, hostToken: string): Promise<void> {
  await fetch(`${BASE}/rooms/${roomId}`, {
    method: 'DELETE',
    headers: { 'X-Host-Token': hostToken },
  })
}

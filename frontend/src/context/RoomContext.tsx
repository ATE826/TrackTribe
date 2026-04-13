import React, { createContext, useContext, useReducer } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
export interface TrackInfo {
  id: string
  title: string
  artist: string
  image: string
  duration: number
  previewUrl?: string
}

export interface Track {
  queueId: string
  info: TrackInfo
  votes: number
  addedBy: string
  addedAt?: string
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  volume: number
  trackId: string
}

export interface SkipState {
  current: number
  threshold: number
  trackId: string
}

export interface RoomState {
  queue: Track[]
  currentTrack: Track | null
  playback: PlaybackState
  guestCount: number
  skipState: SkipState | null
}

type Action =
  | { type: 'SET_ALL'; payload: Partial<RoomState> }
  | { type: 'SET_QUEUE'; payload: Track[] }
  | { type: 'SET_TRACK'; payload: Track | null }
  | { type: 'SET_PLAYBACK'; payload: PlaybackState }
  | { type: 'SET_SKIP'; payload: SkipState | null }
  | { type: 'SET_GUESTS'; payload: number }

// ── Reducer ────────────────────────────────────────────────────────────────
const initial: RoomState = {
  queue: [],
  currentTrack: null,
  playback: { isPlaying: false, currentTime: 0, volume: 0.8, trackId: '' },
  guestCount: 0,
  skipState: null,
}

function reducer(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case 'SET_ALL':    return { ...state, ...action.payload }
    case 'SET_QUEUE':  return { ...state, queue: action.payload }
    case 'SET_TRACK':  return { ...state, currentTrack: action.payload, skipState: null }
    case 'SET_PLAYBACK': return { ...state, playback: action.payload }
    case 'SET_SKIP':   return { ...state, skipState: action.payload }
    case 'SET_GUESTS': return { ...state, guestCount: action.payload }
    default: return state
  }
}

// ── Context ────────────────────────────────────────────────────────────────
interface RoomCtx extends RoomState {
  dispatch: React.Dispatch<Action>
}

const RoomContext = createContext<RoomCtx>({ ...initial, dispatch: () => {} })

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initial)
  return (
    <RoomContext.Provider value={{ ...state, dispatch }}>
      {children}
    </RoomContext.Provider>
  )
}

export const useRoomContext = () => useContext(RoomContext)

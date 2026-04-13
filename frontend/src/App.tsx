import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { RoomProvider } from './context/RoomContext'
import LandingPage from './pages/LandingPage'
import RoomPage from './pages/RoomPage'
import SavedTracksPage from './pages/SavedTracksPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/room/:roomId"
            element={
              <RoomProvider>
                <RoomPage />
              </RoomProvider>
            }
          />
          <Route path="/saved" element={<SavedTracksPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

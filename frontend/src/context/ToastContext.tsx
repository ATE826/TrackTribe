import React, { createContext, useContext, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastCtx {
  showToast: (message: string, type?: ToastType) => void
}

// ── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastCtx>({ showToast: () => {} })

let counter = 0

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div style={styles.container}>
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              ...styles.toast,
              borderColor:
                t.type === 'success' ? 'rgba(34,197,94,0.35)' :
                t.type === 'error'   ? 'rgba(239,68,68,0.35)' :
                'rgba(249,115,22,0.25)',
            }}
          >
            <span style={{
              fontSize: 15,
              color:
                t.type === 'success' ? '#22c55e' :
                t.type === 'error'   ? '#ef4444' : '#f97316',
            }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '♪'}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

// ── Styles ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'none',
  },
  toast: {
    background: '#212128',
    border: '1px solid',
    borderRadius: 12,
    padding: '12px 18px',
    fontSize: 13,
    fontWeight: 600,
    color: '#f0f0f5',
    fontFamily: "'Montserrat', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    maxWidth: 300,
    animation: 'toastIn 0.3s ease',
  },
}

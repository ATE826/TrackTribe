import { useEffect, useRef, useCallback } from 'react'

interface WSMessage {
  type: string
  payload: unknown
}

type MessageHandler = (msg: WSMessage) => void

export function useWebSocket(url: string, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelay = useRef(1000)
  const onMessageRef = useRef(onMessage)
  const mountedRef = useRef(true)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectDelay.current = 1000 // сброс задержки при успешном подключении
    }

    ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data)
        onMessageRef.current(msg)
      } catch {
        // игнорируем невалидный JSON
      }
    }

    ws.onclose = () => {
      if (!mountedRef.current) return
      // Экспоненциальный reconnect: 1s → 2s → 4s → 8s → max 30s
      setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30_000)
        connect()
      }, reconnectDelay.current)
    }

    ws.onerror = () => ws.close()
  }, [url])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      wsRef.current?.close()
    }
  }, [connect])

  // Отправка сообщения серверу
  const send = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  return { send }
}

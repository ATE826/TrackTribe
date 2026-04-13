import React, { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'

interface Props {
  url: string
  size?: number
}

export default function QRCode({ url, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width:  size,
      margin: 1,
      color: {
        dark:  '#f0f0f5',  // светлые точки (инвертировано под тёмную тему)
        light: '#1a1a20',  // тёмный фон карточки
      },
    }).catch(() => {})
  }, [url, size])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <canvas
        ref={canvasRef}
        style={{ borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}
      />
      <p style={{ fontSize: 10, color: '#555568', fontWeight: 600, letterSpacing: '0.04em' }}>
        QR ДЛЯ ГОСТЕЙ
      </p>
    </div>
  )
}

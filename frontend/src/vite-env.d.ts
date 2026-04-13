/// <reference types="vite/client" />
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.svg' {
  const src: string
  export default src
}
declare module 'qrcode' {
  export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: Record<string, unknown>): Promise<void>
  export function toDataURL(text: string, options?: Record<string, unknown>): Promise<string>
}

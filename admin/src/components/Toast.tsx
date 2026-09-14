import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'error'
}

type Listener = (item: ToastItem) => void

let listeners: Listener[] = []
let seq = 0

export function toast(message: string, tone: ToastItem['tone'] = 'success') {
  const item: ToastItem = { id: ++seq, message, tone }
  listeners.forEach((l) => l(item))
}

function subscribe(listener: Listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribe((item) => setItems((list) => [...list, item])), [])

  useEffect(() => {
    if (items.length === 0) return
    const timer = window.setTimeout(() => {
      setItems((list) => list.slice(1))
    }, 2600)
    return () => window.clearTimeout(timer)
  }, [items])

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="pointer-events-none fixed right-4 top-20 z-[1200] flex flex-col items-end gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`animate-fade-up card border px-4 py-2.5 text-sm shadow-seal ${
            item.tone === 'error'
              ? 'border-cinnabar/60 bg-cinnabar/15 text-cinnabarlight'
              : 'border-bronze/60 bg-bronze/15 text-bronzelight'
          }`}
        >
          {item.message}
        </div>
      ))}
    </div>,
    document.body,
  )
}
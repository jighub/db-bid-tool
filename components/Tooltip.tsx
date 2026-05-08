'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  text: string
  children: React.ReactNode
  width?: string
  direction?: 'up' | 'down'
}

const widthToPx: Record<string, number> = {
  'w-52': 208,
  'w-56': 224,
  'w-64': 256,
}

export default function Tooltip({ text, children, width = 'w-52', direction = 'up' }: Props) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const isDown = direction === 'down'
  const popupWidth = widthToPx[width] ?? 208

  useLayoutEffect(() => {
    if (!show || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const margin = 8
    let left = centerX - popupWidth / 2
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin))
    const top = isDown ? rect.bottom + 8 : rect.top - 8
    setCoords({ top, left })
  }, [show, isDown, popupWidth])

  return (
    <>
      <span
        ref={triggerRef}
        className="relative inline-flex items-center"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </span>
      {show && coords && typeof document !== 'undefined' &&
        createPortal(
          <span
            className={`fixed ${width} text-xs bg-slate-800 text-white rounded-lg px-3 py-2 z-[9999] shadow-lg text-center pointer-events-none leading-relaxed whitespace-normal block`}
            style={{
              top: coords.top,
              left: coords.left,
              transform: isDown ? 'none' : 'translateY(-100%)',
            }}
          >
            {text}
          </span>,
          document.body
        )
      }
    </>
  )
}

export function InfoIcon() {
  return (
    <span
      aria-label="More info"
      className="inline-flex items-center justify-center w-4 h-4 rounded-full ml-1.5 cursor-help select-none shrink-0"
      style={{ backgroundColor: '#0a3354', color: '#ffffff' }}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <circle cx="8" cy="3.5" r="1.4" />
        <rect x="6.7" y="6.2" width="2.6" height="7.2" rx="1.1" />
      </svg>
    </span>
  )
}

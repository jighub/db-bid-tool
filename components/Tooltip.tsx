'use client'

import { useState } from 'react'

interface Props {
  text: string
  children: React.ReactNode
  width?: string
  direction?: 'up' | 'down'
}

export default function Tooltip({ text, children, width = 'w-52', direction = 'up' }: Props) {
  const [show, setShow] = useState(false)

  const isDown = direction === 'down'

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={e => e.stopPropagation()}
    >
      {children}
      {show && (
        <span
          className={`absolute ${isDown ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 ${width} text-xs bg-slate-800 text-white rounded-lg px-3 py-2 z-50 shadow-lg text-center pointer-events-none leading-relaxed`}
        >
          {text}
          <span className={`absolute ${isDown ? 'bottom-full border-b-slate-800 border-t-transparent' : 'top-full border-t-slate-800 border-b-transparent'} left-1/2 -translate-x-1/2 border-4 border-l-transparent border-r-transparent`} />
        </span>
      )}
    </span>
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

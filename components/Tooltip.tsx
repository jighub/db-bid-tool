'use client'

import { useState } from 'react'

interface Props {
  text: string
  children: React.ReactNode
  width?: string
}

export default function Tooltip({ text, children, width = 'w-52' }: Props) {
  const [show, setShow] = useState(false)

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 ${width} text-xs bg-slate-800 text-white rounded-lg px-3 py-2 z-50 shadow-lg text-center pointer-events-none leading-relaxed`}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

export function InfoIcon() {
  return (
    <span
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold ml-1 cursor-default select-none"
      style={{ backgroundColor: '#cbd5e1', color: '#475569' }}
    >
      i
    </span>
  )
}

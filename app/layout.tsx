import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Event Bid Management | Destination Battlefords',
  description: 'Track and score event bid opportunities for the Battlefords region.',
  robots: 'noindex',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}

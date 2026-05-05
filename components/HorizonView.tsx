'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ASSET_LABELS, type AssetTag, type HorizonItem } from '@/lib/types'

const PRIORITY_BADGE: { key: keyof HorizonItem; label: string; bg: string; color: string }[] = [
  { key: 'bha_overnight_priority', label: 'Overnight Stay', bg: '#fef9c3', color: '#92400e' },
  { key: 'city_venue_priority', label: 'City Venue', bg: '#dbeafe', color: '#1e40af' },
  { key: 'local_club_priority', label: 'Local Club', bg: '#dcfce7', color: '#166534' },
]

interface Props {
  onAddToPipeline: (item: HorizonItem) => void
}

export default function HorizonView({ onAddToPipeline }: Props) {
  const [items, setItems] = useState<HorizonItem[]>([])
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState('')
  const [lastRunAt, setLastRunAt] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    const { data } = await supabase
      .from('bid_horizon_items')
      .select('*')
      .eq('dismissed', false)
      .order('outreach_by', { ascending: true, nullsFirst: false })
    setItems((data ?? []) as HorizonItem[])

    const { data: runData } = await supabase
      .from('bid_horizon_runs')
      .select('created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setLastRunAt(runData?.created_at ?? null)
    setLoading(false)
  }

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function runScan() {
    setScanning(true)
    setScanStatus('Scanning for 2027–2028 opportunities…')

    const startedAt = new Date().toISOString()

    // Fire and forget — don't await; the connection may drop before the ~20s response
    fetch('/api/horizon', { method: 'POST' }).catch(() => {})

    // Poll Supabase every 2s until the run completes
    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('bid_horizon_runs')
        .select('status, items_found')
        .gte('created_at', startedAt)
        .neq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) return // still running

      clearInterval(pollRef.current!)
      pollRef.current = null

      if (data.status === 'completed') {
        setScanStatus(`Found ${data.items_found} opportunities`)
        await fetchItems()
      } else {
        setScanStatus('Scan failed — try again')
      }
      setScanning(false)
      setTimeout(() => setScanStatus(''), 6000)
    }, 2000)

    // Safety cutoff after 90 seconds
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
        setScanning(false)
        setScanStatus('Scan is taking longer than expected — refresh to see results')
        setTimeout(() => setScanStatus(''), 8000)
      }
    }, 90000)
  }

  async function dismiss(id: string) {
    await supabase.from('bid_horizon_items').update({ dismissed: true }).eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function copyDetails(item: HorizonItem) {
    const text = [
      `Event: ${item.event_name}`,
      `Governing Body: ${item.governing_body}`,
      item.governing_body_website ? `Website: ${item.governing_body_website}` : null,
      item.estimated_event_year ? `Target Year: ${item.estimated_event_year}` : null,
      item.estimated_bid_window ? `Bid Window: ${item.estimated_bid_window}` : null,
      item.outreach_by ? `Start Outreach By: ${new Date(item.outreach_by).toLocaleDateString('en-CA')}` : null,
      item.strategic_fit ? `\nWhy DB: ${item.strategic_fit}` : null,
      item.key_requirements ? `\nKey Requirements: ${item.key_requirements}` : null,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
  }

  const urgentCount = items.filter(i => {
    if (!i.outreach_by) return false
    const days = Math.ceil((new Date(i.outreach_by).getTime() - Date.now()) / 86400000)
    return days <= 90 && days >= 0
  }).length

  if (loading) {
    return <div className="text-sm text-slate-400 py-12 text-center">Loading horizon pipeline…</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-slate-800">1–2 Year Horizon</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real events opening bids for 2027–2028 that align with DB&apos;s strategic priorities.
            {lastRunAt && (
              <span className="ml-2 text-slate-400">
                Last scanned: {new Date(lastRunAt).toLocaleDateString('en-CA')}
              </span>
            )}
          </p>
          {urgentCount > 0 && (
            <p className="text-xs font-semibold mt-1" style={{ color: '#b45309' }}>
              ⚠ {urgentCount} {urgentCount === 1 ? 'opportunity needs' : 'opportunities need'} outreach within 90 days
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scanStatus && <span className="text-xs text-slate-500 max-w-[200px] truncate">{scanStatus}</span>}
          <button
            onClick={runScan}
            disabled={scanning}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
            style={{ backgroundColor: '#0a3354', color: '#fff' }}
          >
            <span style={{ display: 'inline-block', animation: scanning ? 'spin 1s linear infinite' : 'none' }}>
              ↻
            </span>
            {scanning ? 'Scanning…' : items.length > 0 ? 'Re-scan' : 'Scan for Opportunities'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-500 text-sm mb-1">No horizon opportunities yet.</p>
          <p className="text-slate-400 text-xs">Click &quot;Scan for Opportunities&quot; to generate a 2027–2028 pipeline based on DB&apos;s strategic priorities.</p>
        </div>
      )}

      {/* Cards grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <HorizonCard
              key={item.id}
              item={item}
              onDismiss={() => dismiss(item.id)}
              onCopy={() => copyDetails(item)}
              onAddToPipeline={() => onAddToPipeline(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HorizonCard({
  item,
  onDismiss,
  onCopy,
  onAddToPipeline,
}: {
  item: HorizonItem
  onDismiss: () => void
  onCopy: () => void
  onAddToPipeline: () => void
}) {
  const [copied, setCopied] = useState(false)

  const daysUntilOutreach = item.outreach_by
    ? Math.ceil((new Date(item.outreach_by).getTime() - Date.now()) / 86400000)
    : null

  const outreachUrgency =
    daysUntilOutreach !== null && daysUntilOutreach <= 0
      ? 'overdue'
      : daysUntilOutreach !== null && daysUntilOutreach <= 90
      ? 'soon'
      : 'future'

  const urgencyStyle = {
    overdue: { bg: '#fee2e2', color: '#991b1b', label: 'Outreach overdue' },
    soon: { bg: '#fef9c3', color: '#92400e', label: `Outreach in ${daysUntilOutreach}d` },
    future: { bg: '#f1f5f9', color: '#475569', label: item.outreach_by ? `Outreach by ${new Date(item.outreach_by).toLocaleDateString('en-CA', { month: 'short', year: 'numeric' })}` : 'No outreach date' },
  }[outreachUrgency]

  function handleCopy() {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm leading-snug">{item.event_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{item.governing_body}</p>
        </div>
        {item.estimated_event_year && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: '#0a3354', color: '#fdb528' }}
          >
            {item.estimated_event_year}
          </span>
        )}
      </div>

      {/* Outreach urgency */}
      <span
        className="text-xs font-semibold px-2 py-1 rounded self-start"
        style={{ backgroundColor: urgencyStyle.bg, color: urgencyStyle.color }}
      >
        {urgencyStyle.label}
      </span>

      {/* Priority badges */}
      <div className="flex flex-wrap gap-1">
        {PRIORITY_BADGE.filter(b => item[b.key]).map(b => (
          <span
            key={b.key}
            className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ backgroundColor: b.bg, color: b.color }}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* Strategic fit */}
      {item.strategic_fit && (
        <p className="text-xs text-slate-600 leading-relaxed">{item.strategic_fit}</p>
      )}

      {/* Key requirements */}
      {item.key_requirements && (
        <div className="bg-slate-50 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-500 font-semibold mb-0.5">Requirements</p>
          <p className="text-xs text-slate-600">{item.key_requirements}</p>
        </div>
      )}

      {/* Assets */}
      {item.assets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.assets.map(a => (
            <span
              key={a}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
            >
              {ASSET_LABELS[a as AssetTag] ?? a}
            </span>
          ))}
        </div>
      )}

      {/* Bid window */}
      {item.estimated_bid_window && (
        <p className="text-xs text-slate-400">{item.estimated_bid_window}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap pt-1 border-t border-slate-100">
        {item.governing_body_website && (
          <a
            href={item.governing_body_website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#f1f5f9', color: '#0a3354' }}
          >
            Website ↗
          </a>
        )}
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          {copied ? '✓ Copied' : 'Copy for HubSpot'}
        </button>
        <a
          href="https://app.hubspot.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 font-semibold"
          style={{ backgroundColor: '#ff7a59', color: '#fff' }}
        >
          Open HubSpot
        </a>
        <button
          onClick={onAddToPipeline}
          className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 font-semibold"
          style={{ backgroundColor: '#fdb528', color: '#0a3354' }}
        >
          + Add to Pipeline
        </button>
        <button
          onClick={onDismiss}
          className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-80 ml-auto"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

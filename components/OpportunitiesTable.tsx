'use client'

import { useState } from 'react'
import { calcTotal, getRecommendation } from '@/lib/scoring'
import { ASSET_LABELS, STAGE_LABELS, type AssetTag, type EventType, type Opportunity, type Stage } from '@/lib/types'

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  Pursue: { bg: '#fdb528', color: '#0a3354' },
  Consider: { bg: '#dbeafe', color: '#1e40af' },
  Pass: { bg: '#fee2e2', color: '#991b1b' },
}

const STAGE_COLORS: Record<Stage, string> = {
  prospecting: '#e2e8f0',
  'in-progress': '#dbeafe',
  submitted: '#fef9c3',
  won: '#dcfce7',
  lost: '#fee2e2',
}

interface Props {
  opps: Opportunity[]
  onEdit: (opp: Opportunity) => void
  onScore: (opp: Opportunity) => void
  onDelete: (id: string) => void
  onMoveStage: (id: string, stage: Stage) => void
}

export default function OpportunitiesTable({ opps, onEdit, onScore, onDelete, onMoveStage }: Props) {
  const [filterType, setFilterType] = useState<EventType | ''>('')
  const [filterStage, setFilterStage] = useState<Stage | ''>('')
  const [filterAsset, setFilterAsset] = useState<AssetTag | ''>('')
  const [filterPriority, setFilterPriority] = useState<'bha' | 'city' | 'club' | ''>('')
  const [filterRec, setFilterRec] = useState<'Pursue' | 'Consider' | 'Pass' | ''>('')
  const [search, setSearch] = useState('')

  const filtered = opps.filter(o => {
    if (filterType && o.event_type !== filterType) return false
    if (filterStage && o.stage !== filterStage) return false
    if (filterAsset && !o.assets.includes(filterAsset)) return false
    if (filterPriority === 'bha' && !o.bha_overnight_priority) return false
    if (filterPriority === 'city' && !o.city_venue_priority) return false
    if (filterPriority === 'club' && !o.local_club_priority) return false
    if (filterRec) {
      const total = calcTotal(o.scores, o.bid_deadline)
      if (getRecommendation(total) !== filterRec) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!o.event_name.toLowerCase().includes(q) && !o.governing_body.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 w-48"
        />
        <Select value={filterType} onChange={e => setFilterType(e.target.value as EventType | '')}>
          <option value="">All types</option>
          <option value="sporting">Sporting</option>
          <option value="cultural">Cultural</option>
          <option value="conference">Conference</option>
          <option value="other">Other</option>
        </Select>
        <Select value={filterStage} onChange={e => setFilterStage(e.target.value as Stage | '')}>
          <option value="">All stages</option>
          {(Object.keys(STAGE_LABELS) as Stage[]).map(s => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </Select>
        <Select value={filterRec} onChange={e => setFilterRec(e.target.value as typeof filterRec)}>
          <option value="">All recommendations</option>
          <option value="Pursue">Pursue</option>
          <option value="Consider">Consider</option>
          <option value="Pass">Pass</option>
        </Select>
        <Select value={filterAsset} onChange={e => setFilterAsset(e.target.value as AssetTag | '')}>
          <option value="">All assets</option>
          {(Object.keys(ASSET_LABELS) as AssetTag[]).map(a => (
            <option key={a} value={a}>{ASSET_LABELS[a]}</option>
          ))}
        </Select>
        <Select value={filterPriority} onChange={e => setFilterPriority(e.target.value as typeof filterPriority)}>
          <option value="">All priorities</option>
          <option value="bha">BHA Overnight</option>
          <option value="city">City Venue</option>
          <option value="club">Local Club</option>
        </Select>
        {(filterType || filterStage || filterAsset || filterPriority || filterRec || search) && (
          <button
            onClick={() => {
              setFilterType('')
              setFilterStage('')
              setFilterAsset('')
              setFilterPriority('')
              setFilterRec('')
              setSearch('')
            }}
            className="text-xs px-2 py-1 rounded text-slate-500 hover:text-slate-700"
          >
            Clear ✕
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-2">{filtered.length} opportunities</p>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Event', 'Governing Body', 'Type', 'Stage', 'Assets', 'Score', 'Rec', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((opp, i) => {
                const total = calcTotal(opp.scores, opp.bid_deadline)
                const rec = getRecommendation(total)
                const recStyle = REC_STYLE[rec]
                return (
                  <tr
                    key={opp.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    style={i % 2 === 0 ? {} : { backgroundColor: '#fafbfc' }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-sm">{opp.event_name}</div>
                      {opp.bid_deadline && (
                        <div className="text-xs text-slate-400">
                          Deadline: {new Date(opp.bid_deadline).toLocaleDateString('en-CA')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{opp.governing_body}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {opp.event_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={opp.stage}
                        onChange={e => onMoveStage(opp.id, e.target.value as Stage)}
                        className="text-xs px-2 py-1 rounded border-0 cursor-pointer"
                        style={{ backgroundColor: STAGE_COLORS[opp.stage], color: '#475569' }}
                      >
                        {(Object.keys(STAGE_LABELS) as Stage[]).map(s => (
                          <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {opp.assets.slice(0, 2).map(a => (
                          <span key={a} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                            {ASSET_LABELS[a]}
                          </span>
                        ))}
                        {opp.assets.length > 2 && <span className="text-xs text-slate-400">+{opp.assets.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${total}%`,
                              backgroundColor: total >= 70 ? '#fdb528' : total >= 45 ? '#60a5fa' : '#f87171',
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{total}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap"
                        style={{ backgroundColor: recStyle.bg, color: recStyle.color }}
                      >
                        {rec}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onScore(opp)}
                          className="text-xs px-2 py-1 rounded hover:opacity-80"
                          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                        >
                          Score
                        </button>
                        <button
                          onClick={() => onEdit(opp)}
                          className="text-xs px-2 py-1 rounded hover:opacity-80"
                          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                        >
                          Edit
                        </button>
                        {opp.url && (
                          <a
                            href={opp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded hover:opacity-80"
                            style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
                          >
                            ↗
                          </a>
                        )}
                        <button
                          onClick={() => { if (confirm(`Delete "${opp.event_name}"?`)) onDelete(opp.id) }}
                          className="text-xs px-2 py-1 rounded hover:opacity-80"
                          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-400">
                    No opportunities match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="text-xs px-3 py-1.5 rounded border border-slate-200 bg-white text-slate-700 cursor-pointer"
    >
      {children}
    </select>
  )
}

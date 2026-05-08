'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { calcLeadTime, calcTotal, getRecommendation, SCORE_LABELS, SCORE_MAX } from '@/lib/scoring'
import type { Opportunity, Scores } from '@/lib/types'

interface Props {
  opp: Opportunity
  onClose: () => void
  onSave: (updated: Opportunity) => void
}

const CRITERIA = ['overnight_stay', 'local_alignment', 'venue_fit', 'economic_impact', 'competitiveness'] as const

const CRITERIA_HINTS: Record<string, string> = {
  overnight_stay: 'Does this event require out-of-town participants who need hotel rooms?',
  local_alignment: 'Does a local club, school, or org already run or support this discipline?',
  venue_fit: 'Do Battlefords venues meet the technical requirements with little/no additional investment?',
  economic_impact: 'Total estimated visitor spend, sponsorship, and media exposure.',
  competitiveness: 'How realistic is it to win this bid against other host cities?',
}

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  Pursue: { bg: '#fdb528', color: '#0a3354' },
  Consider: { bg: '#dbeafe', color: '#1e40af' },
  Pass: { bg: '#fee2e2', color: '#991b1b' },
}

export default function ScorePanel({ opp, onClose, onSave }: Props) {
  const [scores, setScores] = useState<Scores>({ ...opp.scores })
  const [saving, setSaving] = useState(false)

  const leadTime = calcLeadTime(opp.bid_deadline)
  const total = calcTotal(scores, opp.bid_deadline)
  const rec = getRecommendation(total)
  const recStyle = REC_STYLE[rec]

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('bid_opportunities')
      .update({ scores })
      .eq('id', opp.id)
    setSaving(false)
    if (!error) {
      onSave({ ...opp, scores })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,51,84,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-800">Score Opportunity</h2>
            <p className="text-xs text-slate-500 mt-0.5">{opp.event_name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {CRITERIA.map(key => {
            const max = SCORE_MAX[key]
            const val = scores[key] ?? 0
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">{SCORE_LABELS[key]}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{CRITERIA_HINTS[key]}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800 ml-4 shrink-0">
                    {val} / {max}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={max}
                  value={val}
                  onChange={e => setScores(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="w-full h-2 rounded appearance-none cursor-pointer"
                  style={{ accentColor: '#0a3354' }}
                />
                <div className="flex justify-between text-xs text-slate-300 mt-0.5">
                  <span>0</span>
                  <span>{max}</span>
                </div>
              </div>
            )
          })}

          {/* Lead time (auto) */}
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-semibold text-slate-600">{SCORE_LABELS.lead_time}</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {opp.bid_deadline
                    ? `Bid deadline: ${new Date(opp.bid_deadline).toLocaleDateString('en-CA')}`
                    : 'No deadline set - defaulting to 5 pts'}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-600">{leadTime} / 10</span>
            </div>
          </div>

          {/* Total */}
          <div
            className="rounded-lg px-4 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#0a3354' }}
          >
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Total Score</p>
              <p className="text-3xl font-black text-white mt-0.5">{total}<span className="text-lg text-blue-300 font-normal">/100</span></p>
            </div>
            <span
              className="text-sm font-black px-4 py-2 rounded-full"
              style={{ backgroundColor: recStyle.bg, color: recStyle.color }}
            >
              {rec}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-4 py-2 rounded font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#0a3354', color: '#fff' }}
          >
            {saving ? 'Saving…' : 'Save Scores'}
          </button>
        </div>
      </div>
    </div>
  )
}

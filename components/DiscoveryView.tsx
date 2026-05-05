'use client'

import { supabase } from '@/lib/supabase'
import { calcTotal, getRecommendation } from '@/lib/scoring'
import { ASSET_LABELS, type Opportunity } from '@/lib/types'

interface Props {
  opps: Opportunity[]
  onRefresh: () => Promise<void>
  onReview: (opp: Opportunity) => void
  onReject: (id: string) => void
}

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  Pursue: { bg: '#fdb528', color: '#0a3354' },
  Consider: { bg: '#dbeafe', color: '#1e40af' },
  Pass: { bg: '#fee2e2', color: '#991b1b' },
}

export default function DiscoveryView({ opps, onRefresh, onReview, onReject }: Props) {
  const pending = opps.filter(o => !o.is_reviewed && o.source === 'ai_discovery')

  async function approve(opp: Opportunity) {
    await supabase.from('bid_opportunities').update({ is_reviewed: true }).eq('id', opp.id)
    onReview(opp)
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-800 mb-1">Pending Review</h2>
        <p className="text-sm text-slate-500">
          Opportunities surfaced by the last refresh. Review each one before it enters your pipeline.
          Use the <strong>Refresh Opportunities</strong> button in the nav to scan for new ones.
        </p>
      </div>

      {pending.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-sm font-medium text-slate-500 mb-1">No opportunities pending review</p>
          <p className="text-xs text-slate-400">Hit <strong>Refresh Opportunities</strong> in the nav bar to scan for new ones.</p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map(opp => {
          const total = calcTotal(opp.scores, opp.bid_deadline)
          const rec = getRecommendation(total)
          const recStyle = REC_STYLE[rec]
          return (
            <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-slate-800 text-sm">{opp.event_name}</h4>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: recStyle.bg, color: recStyle.color }}
                    >
                      {rec}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">AI</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{opp.governing_body}</p>

                  {opp.notes && (
                    <p className="text-xs text-slate-500 mt-2 italic">{opp.notes}</p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {opp.assets.map(a => (
                      <span key={a} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                        {ASSET_LABELS[a]}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    {opp.typical_attendance && <span>~{opp.typical_attendance.toLocaleString()} attendees</span>}
                    {opp.bid_deadline && <span>Deadline: {new Date(opp.bid_deadline).toLocaleDateString('en-CA')}</span>}
                    <span className="font-semibold" style={{ color: recStyle.color }}>Score: {total}/100</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => approve(opp)}
                    className="text-xs px-3 py-1.5 rounded font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                  >
                    ✓ Add to Pipeline
                  </button>
                  <button
                    onClick={() => { if (confirm(`Reject "${opp.event_name}"?`)) onReject(opp.id) }}
                    className="text-xs px-3 py-1.5 rounded font-semibold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

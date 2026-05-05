'use client'

import { calcTotal, getRecommendation } from '@/lib/scoring'
import { ASSET_LABELS, STAGE_LABELS, type Opportunity, type Stage } from '@/lib/types'

const STAGES: Stage[] = ['prospecting', 'in-progress', 'submitted', 'won', 'lost']

const STAGE_COLORS: Record<Stage, string> = {
  prospecting: '#e2e8f0',
  'in-progress': '#dbeafe',
  submitted: '#fef9c3',
  won: '#dcfce7',
  lost: '#fee2e2',
}

const STAGE_TEXT: Record<Stage, string> = {
  prospecting: '#475569',
  'in-progress': '#1d4ed8',
  submitted: '#92400e',
  won: '#166534',
  lost: '#991b1b',
}

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  Pursue: { bg: '#fdb528', color: '#0a3354' },
  Consider: { bg: '#dbeafe', color: '#1e40af' },
  Pass: { bg: '#fee2e2', color: '#991b1b' },
}

interface Props {
  opps: Opportunity[]
  onMoveStage: (id: string, stage: Stage) => void
  onEdit: (opp: Opportunity) => void
  onScore: (opp: Opportunity) => void
  onDelete: (id: string) => void
}

export default function PipelineView({ opps, onMoveStage, onEdit, onScore, onDelete }: Props) {
  const byStage = (stage: Stage) => opps.filter(o => o.stage === stage)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-[900px]">
        {STAGES.map(stage => {
          const cards = byStage(stage)
          return (
            <div key={stage} className="flex-1 min-w-[170px]">
              <div
                className="flex items-center justify-between px-3 py-2 rounded-t-lg mb-2"
                style={{ backgroundColor: STAGE_COLORS[stage] }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: STAGE_TEXT[stage] }}>
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  className="text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                  style={{ backgroundColor: STAGE_TEXT[stage], color: STAGE_COLORS[stage] }}
                >
                  {cards.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {cards.map(opp => (
                  <OppCard
                    key={opp.id}
                    opp={opp}
                    onMoveStage={onMoveStage}
                    onEdit={onEdit}
                    onScore={onScore}
                    onDelete={onDelete}
                  />
                ))}
                {cards.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-lg">
                    None
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OppCard({
  opp,
  onMoveStage,
  onEdit,
  onScore,
  onDelete,
}: {
  opp: Opportunity
  onMoveStage: (id: string, stage: Stage) => void
  onEdit: (opp: Opportunity) => void
  onScore: (opp: Opportunity) => void
  onDelete: (id: string) => void
}) {
  const total = calcTotal(opp.scores, opp.bid_deadline)
  const rec = getRecommendation(total)
  const recStyle = REC_STYLE[rec]
  const otherStages = STAGES.filter(s => s !== opp.stage)
  const isDemo = opp.notes?.startsWith('[DEMO PLACEHOLDER]') ?? false

  return (
    <div className="bg-white rounded-lg border p-3 text-sm shadow-sm" style={{ borderColor: isDemo ? '#c4b5fd' : '#e2e8f0' }}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-semibold text-slate-800 leading-tight text-xs">{opp.event_name}</span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ backgroundColor: recStyle.bg, color: recStyle.color }}
        >
          {rec}
        </span>
      </div>
      {isDemo && (
        <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded mb-1" style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
          Demo example
        </span>
      )}

      <p className="text-xs text-slate-500 mb-2">{opp.governing_body}</p>

      {/* Score bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
          <span>Score</span>
          <span className="font-semibold text-slate-600">{total}/100</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${total}%`,
              backgroundColor: total >= 70 ? '#fdb528' : total >= 45 ? '#60a5fa' : '#f87171',
            }}
          />
        </div>
      </div>

      {/* Assets */}
      {opp.assets.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {opp.assets.slice(0, 3).map(a => (
            <span
              key={a}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
            >
              {ASSET_LABELS[a]}
            </span>
          ))}
          {opp.assets.length > 3 && (
            <span className="text-xs text-slate-400">+{opp.assets.length - 3}</span>
          )}
        </div>
      )}

      {/* Deadline */}
      {opp.bid_deadline && (
        <p className="text-xs text-slate-400 mb-2">
          Deadline: {new Date(opp.bid_deadline).toLocaleDateString('en-CA')}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-1 flex-wrap mt-1">
        <button
          onClick={() => onScore(opp)}
          className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          Score
        </button>
        <button
          onClick={() => onEdit(opp)}
          className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
        >
          Edit
        </button>
        <div className="relative group">
          <button
            className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
            style={{ backgroundColor: '#0a3354', color: '#fff' }}
          >
            Move ▾
          </button>
          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 hidden group-hover:block min-w-[120px]">
            {otherStages.map(s => (
              <button
                key={s}
                onClick={() => onMoveStage(opp.id, s)}
                className="block w-full text-left text-xs px-3 py-1.5 hover:bg-slate-50 text-slate-700"
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm(`Delete "${opp.event_name}"?`)) onDelete(opp.id)
          }}
          className="text-xs px-2 py-1 rounded transition-colors hover:opacity-80"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

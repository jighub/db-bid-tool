'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ASSET_LABELS, STAGE_LABELS, type AssetTag, type BidDocument, type EventType, type Opportunity, type Scores, type Stage } from '@/lib/types'
import { calcLeadTime, calcTotal, getRecommendation, SCORE_LABELS, SCORE_MAX } from '@/lib/scoring'

const STAGES: Stage[] = ['prospecting', 'in-progress', 'submitted', 'won', 'lost']
const ASSETS = Object.keys(ASSET_LABELS) as AssetTag[]

const STAGE_COLORS: Record<Stage, { bg: string; color: string }> = {
  prospecting: { bg: '#e2e8f0', color: '#475569' },
  'in-progress': { bg: '#dbeafe', color: '#1d4ed8' },
  submitted: { bg: '#fef9c3', color: '#92400e' },
  won: { bg: '#dcfce7', color: '#166534' },
  lost: { bg: '#fee2e2', color: '#991b1b' },
}

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  Pursue: { bg: '#fdb528', color: '#0a3354' },
  Consider: { bg: '#dbeafe', color: '#1e40af' },
  Pass: { bg: '#fee2e2', color: '#991b1b' },
}

const PRIORITY_FLAGS = [
  { key: 'bha_overnight_priority' as const, label: 'BHA Overnight', desc: 'Drives hotel stays', bg: '#fef9c3', color: '#92400e' },
  { key: 'city_venue_priority' as const, label: 'City Venue', desc: 'Uses Innovation Plex or city-owned venue', bg: '#dbeafe', color: '#1e40af' },
  { key: 'local_club_priority' as const, label: 'Local Club', desc: 'Local club can co-host', bg: '#dcfce7', color: '#166534' },
]

type Section = 'overview' | 'strategy' | 'score' | 'documents'

interface Props {
  opp: Opportunity
  onClose: () => void
  onSave: (updated: Opportunity) => void
  onDelete: (id: string) => void
  onMoveStage: (id: string, stage: Stage) => void
}

export default function BidProfile({ opp, onClose, onSave, onDelete, onMoveStage }: Props) {
  const [section, setSection] = useState<Section>('overview')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...opp })
  const [saving, setSaving] = useState(false)
  const [newDoc, setNewDoc] = useState({ name: '', url: '' })

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function updateScore(key: keyof Scores, value: number) {
    setForm(prev => ({ ...prev, scores: { ...prev.scores, [key]: value } }))
  }

  function toggleAsset(a: AssetTag) {
    update('assets', form.assets.includes(a) ? form.assets.filter(x => x !== a) : [...form.assets, a])
  }

  function discard() {
    setForm({ ...opp })
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    const payload = {
      event_name: form.event_name,
      governing_body: form.governing_body,
      event_type: form.event_type,
      typical_attendance: form.typical_attendance,
      bid_deadline: form.bid_deadline || null,
      event_start: form.event_start || null,
      event_end: form.event_end || null,
      indoor_capacity_needed: form.indoor_capacity_needed,
      accommodation_rooms_needed: form.accommodation_rooms_needed,
      url: form.url || null,
      notes: form.notes || null,
      strategic_fit: form.strategic_fit || null,
      key_requirements: form.key_requirements || null,
      outreach_by: form.outreach_by || null,
      documents: form.documents,
      stage: form.stage,
      assets: form.assets,
      bha_overnight_priority: form.bha_overnight_priority,
      city_venue_priority: form.city_venue_priority,
      local_club_priority: form.local_club_priority,
      scores: form.scores,
    }
    const { data, error } = await supabase
      .from('bid_opportunities')
      .update(payload)
      .eq('id', opp.id)
      .select()
      .single()
    setSaving(false)
    if (!error && data) {
      setEditing(false)
      onSave(data as Opportunity)
    }
  }

  function addDoc() {
    if (!newDoc.name.trim() || !newDoc.url.trim()) return
    const docs: BidDocument[] = [...form.documents, { name: newDoc.name.trim(), url: newDoc.url.trim() }]
    update('documents', docs)
    setNewDoc({ name: '', url: '' })
  }

  function removeDoc(i: number) {
    update('documents', form.documents.filter((_, idx) => idx !== i))
  }

  const total = calcTotal(form.scores, form.bid_deadline)
  const rec = getRecommendation(total)
  const leadTime = calcLeadTime(form.bid_deadline)
  const recStyle = REC_STYLE[rec]

  const sections: { id: Section; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'strategy', label: 'Strategy' },
    { id: 'score', label: 'Score' },
    { id: 'documents', label: `Documents${form.documents.length > 0 ? ` (${form.documents.length})` : ''}` },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(10,51,84,0.4)' }}
        onClick={() => { if (!editing) onClose() }}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 flex flex-col bg-white shadow-2xl w-full max-w-xl">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-slate-800 leading-snug">{form.event_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{form.governing_body}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: recStyle.bg, color: recStyle.color }}>
                {rec}
              </span>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none ml-1">✕</button>
            </div>
          </div>

          {/* Stage selector — always interactive */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => { update('stage', s); onMoveStage(opp.id, s) }}
                className="text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80"
                style={
                  form.stage === s
                    ? { backgroundColor: STAGE_COLORS[s].color, color: '#fff' }
                    : { backgroundColor: '#f1f5f9', color: '#64748b' }
                }
              >
                {STAGE_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Score bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Score</span>
              <span className="font-semibold text-slate-600">{total}/100</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${total}%`,
                  backgroundColor: total >= 70 ? '#fdb528' : total >= 45 ? '#60a5fa' : '#f87171',
                }}
              />
            </div>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-slate-200 px-6">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className="px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap"
              style={
                section === s.id
                  ? { color: '#0a3354', borderBottom: '2px solid #fdb528' }
                  : { color: '#94a3b8', borderBottom: '2px solid transparent' }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* OVERVIEW */}
          {section === 'overview' && !editing && (
            <ViewOverview form={form} />
          )}
          {section === 'overview' && editing && (
            <EditOverview form={form} update={update} toggleAsset={toggleAsset} />
          )}

          {/* STRATEGY */}
          {section === 'strategy' && !editing && (
            <ViewStrategy form={form} />
          )}
          {section === 'strategy' && editing && (
            <EditStrategy form={form} update={update} />
          )}

          {/* SCORE — sliders always interactive */}
          {section === 'score' && (
            <>
              <div
                className="rounded-xl px-4 py-3 mb-2 flex items-center justify-between"
                style={{ backgroundColor: '#0a3354' }}
              >
                <div>
                  <p className="text-xs text-slate-300">Total Score</p>
                  <p className="text-2xl font-bold text-white">{total}<span className="text-sm font-normal text-slate-400">/100</span></p>
                </div>
                <span className="text-sm font-bold px-3 py-1 rounded-lg" style={{ backgroundColor: recStyle.bg, color: recStyle.color }}>
                  {rec}
                </span>
              </div>

              {(Object.keys(SCORE_LABELS).filter(k => k !== 'lead_time') as (keyof Scores)[]).map(key => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-600">{SCORE_LABELS[key]}</span>
                    <span className="text-slate-500">{form.scores[key] ?? 0} / {SCORE_MAX[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={SCORE_MAX[key]}
                    value={form.scores[key] ?? 0}
                    onChange={e => updateScore(key, parseInt(e.target.value))}
                    className="w-full accent-[#0a3354]"
                  />
                </div>
              ))}

              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-600">Lead Time (auto)</span>
                  <span className="text-slate-500">{leadTime} / 10</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {form.bid_deadline
                    ? `Based on bid deadline: ${new Date(form.bid_deadline).toLocaleDateString('en-CA')}`
                    : 'Set a bid deadline in Overview to calculate'}
                </p>
              </div>

              {!editing && (
                <p className="text-xs text-slate-400 text-center pt-1">
                  Score changes save automatically when you click Save.{' '}
                  <button onClick={() => setEditing(true)} className="text-[#0a3354] underline hover:no-underline">Edit other fields</button>
                </p>
              )}
            </>
          )}

          {/* DOCUMENTS */}
          {section === 'documents' && (
            <>
              {form.documents.length === 0 && (
                <p className="text-xs text-slate-400">
                  No documents yet.{!editing && <> <button onClick={() => setEditing(true)} className="text-[#0a3354] underline hover:no-underline">Edit</button> to add links.</>}
                </p>
              )}

              {form.documents.length > 0 && (
                <div className="space-y-2">
                  {form.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-medium text-[#0a3354] hover:underline flex-1 truncate">
                        {doc.name} ↗
                      </a>
                      {editing && (
                        <button onClick={() => removeDoc(i)} className="text-xs text-slate-400 hover:text-red-500 shrink-0">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editing && (
                <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Add a document link</p>
                  <FInput value={newDoc.name} onChange={v => setNewDoc(p => ({ ...p, name: v }))} placeholder="Document name (e.g. RFP 2027)" />
                  <FInput type="url" value={newDoc.url} onChange={v => setNewDoc(p => ({ ...p, url: v }))} placeholder="https://…" />
                  <button onClick={addDoc}
                    disabled={!newDoc.name.trim() || !newDoc.url.trim()}
                    className="text-xs font-semibold px-3 py-1.5 rounded transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{ backgroundColor: '#0a3354', color: '#fff' }}>
                    + Add Link
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => { if (confirm(`Delete "${opp.event_name}"?`)) onDelete(opp.id) }}
            className="text-xs px-3 py-1.5 rounded font-semibold hover:opacity-80"
            style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
            Delete
          </button>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button onClick={onClose} className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Close
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs px-4 py-1.5 rounded font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#0a3354', color: '#fff' }}>
                  Edit
                </button>
              </>
            ) : (
              <>
                <button onClick={discard} className="text-xs px-3 py-1.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-50">
                  Discard
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="text-xs px-4 py-1.5 rounded font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: '#0a3354', color: '#fff' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── View mode components ─────────────────────────────────────────────────────

function ViewOverview({ form }: { form: Opportunity }) {
  const activeFlags = PRIORITY_FLAGS.filter(f => form[f.key])

  return (
    <>
      <dl className="space-y-3">
        <ViewField label="Event Type" value={form.event_type ? form.event_type.charAt(0).toUpperCase() + form.event_type.slice(1) : null} />
        <ViewField label="Typical Attendance" value={form.typical_attendance?.toLocaleString() ?? null} />
        <ViewField label="Bid Deadline" value={form.bid_deadline ? new Date(form.bid_deadline).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : null} />
        <ViewField label="Event Dates" value={
          form.event_start
            ? `${new Date(form.event_start).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}${form.event_end ? ` – ${new Date(form.event_end).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}`
            : null
        } />
        <ViewField label="Indoor Capacity" value={form.indoor_capacity_needed?.toLocaleString() ?? null} />
        <ViewField label="Rooms Needed" value={form.accommodation_rooms_needed?.toString() ?? null} />
        <ViewField label="Outreach By" value={form.outreach_by ? new Date(form.outreach_by).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : null} />
        {form.url && (
          <div className="grid grid-cols-3 gap-2 items-start">
            <dt className="text-xs font-semibold text-slate-500 col-span-1 pt-0.5">Website</dt>
            <dd className="col-span-2">
              <a href={form.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[#0a3354] hover:underline font-medium break-all">
                {form.url.replace(/^https?:\/\//, '')} ↗
              </a>
            </dd>
          </div>
        )}
      </dl>

      {form.notes && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{form.notes}</p>
        </div>
      )}

      {activeFlags.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2">Priority Flags</p>
          <div className="flex flex-wrap gap-1.5">
            {activeFlags.map(f => (
              <span key={f.key} className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: f.bg, color: f.color }}>
                {f.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {form.assets.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-2">Battlefords Assets</p>
          <div className="flex flex-wrap gap-1.5">
            {form.assets.map(a => (
              <span key={a} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>
                {ASSET_LABELS[a]}
              </span>
            ))}
          </div>
        </div>
      )}

      {!form.url && !form.notes && activeFlags.length === 0 && form.assets.length === 0
        && !form.typical_attendance && !form.bid_deadline && !form.event_start && !form.indoor_capacity_needed && (
        <p className="text-xs text-slate-400 text-center py-4">No details yet — click Edit to fill them in.</p>
      )}
    </>
  )
}

function ViewStrategy({ form }: { form: Opportunity }) {
  if (!form.strategic_fit && !form.key_requirements) {
    return <p className="text-xs text-slate-400 text-center py-4">No strategy notes yet — click Edit to add them.</p>
  }
  return (
    <>
      {form.strategic_fit && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Why Destination Battlefords</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{form.strategic_fit}</p>
        </div>
      )}
      {form.key_requirements && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-1.5">Key Requirements</p>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{form.key_requirements}</p>
        </div>
      )}
    </>
  )
}

function ViewField({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="grid grid-cols-3 gap-2 items-start">
      <dt className="text-xs font-semibold text-slate-500 col-span-1 pt-0.5">{label}</dt>
      <dd className="col-span-2 text-sm text-slate-800">{value}</dd>
    </div>
  )
}

// ─── Edit mode components ─────────────────────────────────────────────────────

function EditOverview({ form, update, toggleAsset }: {
  form: Opportunity
  update: <K extends keyof Opportunity>(key: K, value: Opportunity[K]) => void
  toggleAsset: (a: AssetTag) => void
}) {
  return (
    <>
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-600">Event Name</label>
        <FInput value={form.event_name} onChange={v => update('event_name', v)} placeholder="Event name" />
      </div>
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-600">Governing Body</label>
        <FInput value={form.governing_body} onChange={v => update('governing_body', v)} placeholder="Governing body" />
      </div>

      <Row label="Event Type">
        <select value={form.event_type} onChange={e => update('event_type', e.target.value as EventType)}
          className="w-full text-sm px-2 py-1 rounded border border-slate-200 text-slate-700">
          <option value="sporting">Sporting</option>
          <option value="cultural">Cultural</option>
          <option value="conference">Conference</option>
          <option value="other">Other</option>
        </select>
      </Row>
      <Row label="Typical Attendance">
        <FInput type="number" value={form.typical_attendance?.toString() ?? ''} onChange={v => update('typical_attendance', v ? parseInt(v) : null)} placeholder="500" />
      </Row>
      <Row label="Bid Deadline">
        <FInput type="date" value={form.bid_deadline ?? ''} onChange={v => update('bid_deadline', v || null)} />
      </Row>
      <Row label="Event Start">
        <FInput type="date" value={form.event_start ?? ''} onChange={v => update('event_start', v || null)} />
      </Row>
      <Row label="Event End">
        <FInput type="date" value={form.event_end ?? ''} onChange={v => update('event_end', v || null)} />
      </Row>
      <Row label="Indoor Capacity">
        <FInput type="number" value={form.indoor_capacity_needed?.toString() ?? ''} onChange={v => update('indoor_capacity_needed', v ? parseInt(v) : null)} placeholder="2000" />
      </Row>
      <Row label="Rooms Needed">
        <FInput type="number" value={form.accommodation_rooms_needed?.toString() ?? ''} onChange={v => update('accommodation_rooms_needed', v ? parseInt(v) : null)} placeholder="80" />
      </Row>
      <Row label="Website / Bid URL">
        <FInput type="url" value={form.url ?? ''} onChange={v => update('url', v || null)} placeholder="https://…" />
      </Row>
      <Row label="Outreach By">
        <FInput type="date" value={form.outreach_by ?? ''} onChange={v => update('outreach_by', v || null)} />
      </Row>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
        <textarea value={form.notes ?? ''} onChange={e => update('notes', e.target.value || null)}
          rows={3} placeholder="Any additional context…"
          className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 resize-none" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Priority Flags</label>
        <div className="flex flex-col gap-2">
          {PRIORITY_FLAGS.map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={e => update(key, e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#0a3354]" />
              <div>
                <span className="text-xs font-medium text-slate-700">{label}</span>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">Battlefords Assets Required</label>
        <div className="flex flex-wrap gap-1.5">
          {ASSETS.map(a => (
            <button key={a} type="button" onClick={() => toggleAsset(a)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors"
              style={form.assets.includes(a)
                ? { backgroundColor: '#0a3354', color: '#fff', borderColor: '#0a3354' }
                : { backgroundColor: '#fff', color: '#475569', borderColor: '#e2e8f0' }}>
              {ASSET_LABELS[a]}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function EditStrategy({ form, update }: {
  form: Opportunity
  update: <K extends keyof Opportunity>(key: K, value: Opportunity[K]) => void
}) {
  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Why Destination Battlefords</label>
        <p className="text-xs text-slate-400 mb-1.5">Strategic fit — why this event belongs in the Battlefords.</p>
        <textarea value={form.strategic_fit ?? ''} onChange={e => update('strategic_fit', e.target.value || null)}
          rows={5} placeholder="e.g. Multi-day curling tournament drives overnight stays. Twin Rivers Curling Club is an ideal co-host…"
          className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 resize-none" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">Key Requirements</label>
        <p className="text-xs text-slate-400 mb-1.5">What the governing body typically needs from a host city.</p>
        <textarea value={form.key_requirements ?? ''} onChange={e => update('key_requirements', e.target.value || null)}
          rows={4} placeholder="e.g. 8-sheet curling facility, 100+ hotel rooms within 15 min, banquet space for 200…"
          className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 resize-none" />
      </div>
    </>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <label className="text-xs font-semibold text-slate-600 col-span-1">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  )
}

function FInput({ value, onChange, type = 'text', placeholder }: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm px-2 py-1 rounded border border-slate-200 text-slate-700 placeholder-slate-300"
    />
  )
}

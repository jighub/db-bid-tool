'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ASSET_LABELS, type AssetTag, type EventType, type Opportunity, type Stage } from '@/lib/types'

interface Props {
  opp?: Opportunity
  onClose: () => void
  onSave: () => void
}

const ASSETS = Object.keys(ASSET_LABELS) as AssetTag[]

export default function OppModal({ opp, onClose, onSave }: Props) {
  const isEdit = !!opp

  const [form, setForm] = useState({
    event_name: opp?.event_name ?? '',
    governing_body: opp?.governing_body ?? '',
    event_type: (opp?.event_type ?? 'sporting') as EventType,
    typical_attendance: opp?.typical_attendance?.toString() ?? '',
    bid_deadline: opp?.bid_deadline ?? '',
    event_start: opp?.event_start ?? '',
    event_end: opp?.event_end ?? '',
    indoor_capacity_needed: opp?.indoor_capacity_needed?.toString() ?? '',
    accommodation_rooms_needed: opp?.accommodation_rooms_needed?.toString() ?? '',
    outdoor_notes: opp?.outdoor_notes ?? '',
    url: opp?.url ?? '',
    notes: opp?.notes ?? '',
    stage: (opp?.stage ?? 'prospecting') as Stage,
    assets: opp?.assets ?? ([] as AssetTag[]),
    bha_overnight_priority: opp?.bha_overnight_priority ?? false,
    city_venue_priority: opp?.city_venue_priority ?? false,
    local_club_priority: opp?.local_club_priority ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleAsset(a: AssetTag) {
    setForm(prev => ({
      ...prev,
      assets: prev.assets.includes(a) ? prev.assets.filter(x => x !== a) : [...prev.assets, a],
    }))
  }

  async function handleSave() {
    if (!form.event_name.trim() || !form.governing_body.trim()) {
      setError('Event name and governing body are required.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      event_name: form.event_name.trim(),
      governing_body: form.governing_body.trim(),
      event_type: form.event_type,
      typical_attendance: form.typical_attendance ? parseInt(form.typical_attendance) : null,
      bid_deadline: form.bid_deadline || null,
      event_start: form.event_start || null,
      event_end: form.event_end || null,
      indoor_capacity_needed: form.indoor_capacity_needed ? parseInt(form.indoor_capacity_needed) : null,
      accommodation_rooms_needed: form.accommodation_rooms_needed ? parseInt(form.accommodation_rooms_needed) : null,
      outdoor_notes: form.outdoor_notes || null,
      url: form.url || null,
      notes: form.notes || null,
      stage: form.stage,
      assets: form.assets,
      bha_overnight_priority: form.bha_overnight_priority,
      city_venue_priority: form.city_venue_priority,
      local_club_priority: form.local_club_priority,
    }

    let err
    if (isEdit) {
      ;({ error: err } = await supabase.from('bid_opportunities').update(payload).eq('id', opp!.id))
    } else {
      ;({ error: err } = await supabase.from('bid_opportunities').insert({ ...payload, source: 'manual', is_reviewed: true, scores: {} }))
    }

    setSaving(false)
    if (err) {
      setError(err.message)
    } else {
      onSave()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,51,84,0.5)' }}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">
            {isEdit ? 'Edit Opportunity' : 'Add Opportunity'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Event Name *</Label>
              <Input value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} placeholder="e.g. Saskatchewan Curling Championships" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Governing Body *</Label>
              <Input value={form.governing_body} onChange={e => setForm(p => ({ ...p, governing_body: e.target.value }))} placeholder="e.g. Curling Canada" />
            </div>
            <div>
              <Label>Event Type</Label>
              <select
                value={form.event_type}
                onChange={e => setForm(p => ({ ...p, event_type: e.target.value as EventType }))}
                className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700"
              >
                <option value="sporting">Sporting</option>
                <option value="cultural">Cultural</option>
                <option value="conference">Conference</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Stage</Label>
              <select
                value={form.stage}
                onChange={e => setForm(p => ({ ...p, stage: e.target.value as Stage }))}
                className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700"
              >
                <option value="prospecting">Prospecting</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div>
              <Label>Typical Attendance</Label>
              <Input type="number" value={form.typical_attendance} onChange={e => setForm(p => ({ ...p, typical_attendance: e.target.value }))} placeholder="500" />
            </div>
            <div>
              <Label>Rooms Needed</Label>
              <Input type="number" value={form.accommodation_rooms_needed} onChange={e => setForm(p => ({ ...p, accommodation_rooms_needed: e.target.value }))} placeholder="80" />
            </div>
            <div>
              <Label>Bid Deadline</Label>
              <Input type="date" value={form.bid_deadline} onChange={e => setForm(p => ({ ...p, bid_deadline: e.target.value }))} />
            </div>
            <div>
              <Label>Event Start</Label>
              <Input type="date" value={form.event_start} onChange={e => setForm(p => ({ ...p, event_start: e.target.value }))} />
            </div>
            <div>
              <Label>Event End</Label>
              <Input type="date" value={form.event_end} onChange={e => setForm(p => ({ ...p, event_end: e.target.value }))} />
            </div>
            <div>
              <Label>Indoor Capacity Needed</Label>
              <Input type="number" value={form.indoor_capacity_needed} onChange={e => setForm(p => ({ ...p, indoor_capacity_needed: e.target.value }))} placeholder="2000" />
            </div>
            <div className="col-span-2">
              <Label>URL / Website</Label>
              <Input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                placeholder="Any additional context…"
                className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 resize-none"
              />
            </div>
          </div>

          {/* Assets */}
          <div>
            <Label>Battlefords Assets Required</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ASSETS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAsset(a)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors"
                  style={
                    form.assets.includes(a)
                      ? { backgroundColor: '#0a3354', color: '#fff', borderColor: '#0a3354' }
                      : { backgroundColor: '#fff', color: '#475569', borderColor: '#e2e8f0' }
                  }
                >
                  {ASSET_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Priority flags */}
          <div>
            <Label>Priority Flags</Label>
            <div className="flex flex-wrap gap-4 mt-1">
              {[
                { key: 'bha_overnight_priority', label: 'BHA Overnight Priority' },
                { key: 'city_venue_priority', label: 'City Venue Priority' },
                { key: 'local_club_priority', label: 'Local Club Priority' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key as keyof typeof form] as boolean}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#0a3354]"
                  />
                  <span className="text-xs text-slate-700">{label}</span>
                </label>
              ))}
            </div>
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
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Opportunity'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-600 mb-1">{children}</label>
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full text-sm px-3 py-2 rounded border border-slate-200 text-slate-700 placeholder-slate-300"
    />
  )
}

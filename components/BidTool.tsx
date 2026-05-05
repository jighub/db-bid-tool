'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { HorizonItem, Opportunity, Stage } from '@/lib/types'
import PipelineView from './PipelineView'
import OpportunitiesTable from './OpportunitiesTable'
import DiscoveryView from './DiscoveryView'
import ResourcesView from './ResourcesView'
import HorizonView from './HorizonView'
import OppModal from './OppModal'
import ScorePanel from './ScorePanel'

type Tab = 'pipeline' | 'opportunities' | 'review' | 'horizon' | 'resources'

interface Props {
  initialOpportunities: Opportunity[]
}

export default function BidTool({ initialOpportunities }: Props) {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [opps, setOpps] = useState<Opportunity[]>(initialOpportunities)
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [horizonSeed, setHorizonSeed] = useState<HorizonItem | null>(null)
  const [scoringOpp, setScoringOpp] = useState<Opportunity | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState('')

  async function refreshOpps() {
    const { data } = await supabase
      .from('bid_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOpps(data as Opportunity[])
  }

  async function runRefresh() {
    setRefreshing(true)
    setRefreshStatus('Scanning for new opportunities…')
    try {
      const res = await fetch('/api/discover', { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.added > 0) {
        setRefreshStatus(`Found ${json.added} new opportunities — check Pending Review`)
        await refreshOpps()
        setTab('review')
      } else if (res.ok) {
        setRefreshStatus('No new opportunities found this time')
      } else {
        setRefreshStatus(json.error ?? 'Refresh failed')
      }
    } catch {
      setRefreshStatus('Network error — try again')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshStatus(''), 6000)
    }
  }

  async function moveStage(id: string, stage: Stage) {
    await supabase.from('bid_opportunities').update({ stage }).eq('id', id)
    setOpps(prev => prev.map(o => (o.id === id ? { ...o, stage } : o)))
  }

  async function deleteOpp(id: string) {
    await supabase.from('bid_opportunities').delete().eq('id', id)
    setOpps(prev => prev.filter(o => o.id !== id))
  }

  const pendingCount = opps.filter(o => !o.is_reviewed && o.source === 'ai_discovery').length

  const navItems: { id: Tab; label: string }[] = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'review', label: pendingCount > 0 ? `Pending Review (${pendingCount})` : 'Pending Review' },
    { id: 'horizon', label: 'Horizon' },
    { id: 'resources', label: 'Resources' },
  ]

  return (
    <div className="flex-1 flex flex-col">
      {/* Tab nav */}
      <div style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-2 flex-wrap">
          <nav className="flex">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap"
                style={
                  tab === id
                    ? { color: '#0a3354', borderBottom: '3px solid #fdb528', fontWeight: 600 }
                    : { color: '#64748b', borderBottom: '3px solid transparent' }
                }
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 py-2">
            {refreshStatus && (
              <span className="text-xs text-slate-500 max-w-[200px] truncate">{refreshStatus}</span>
            )}
            <button
              onClick={runRefresh}
              disabled={refreshing}
              title="Ask Claude to scan for new bid opportunities"
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
              style={{ backgroundColor: '#f1f5f9', color: '#0a3354', border: '1px solid #cbd5e1' }}
            >
              <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>
                ↻
              </span>
              {refreshing ? 'Refreshing…' : 'Refresh Opportunities'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#0a3354', color: '#fff' }}
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {tab === 'pipeline' && (
          <PipelineView
            opps={opps.filter(o => o.is_reviewed)}
            onMoveStage={moveStage}
            onEdit={opp => setEditingOpp(opp)}
            onScore={opp => setScoringOpp(opp)}
            onDelete={deleteOpp}
          />
        )}
        {tab === 'opportunities' && (
          <OpportunitiesTable
            opps={opps.filter(o => o.is_reviewed)}
            onEdit={opp => setEditingOpp(opp)}
            onScore={opp => setScoringOpp(opp)}
            onDelete={deleteOpp}
            onMoveStage={moveStage}
          />
        )}
        {tab === 'review' && (
          <DiscoveryView
            opps={opps}
            onRefresh={refreshOpps}
            onReview={opp => {
              setOpps(prev => prev.map(o => (o.id === opp.id ? { ...o, is_reviewed: true } : o)))
            }}
            onReject={deleteOpp}
          />
        )}
        {tab === 'horizon' && (
          <HorizonView
            onAddToPipeline={item => {
              setHorizonSeed(item)
              setShowAddModal(true)
            }}
          />
        )}
        {tab === 'resources' && <ResourcesView />}
      </div>

      {/* Modals */}
      {(showAddModal || editingOpp) && (
        <OppModal
          opp={editingOpp ?? undefined}
          horizonSeed={horizonSeed ?? undefined}
          onClose={() => {
            setShowAddModal(false)
            setEditingOpp(null)
            setHorizonSeed(null)
          }}
          onSave={async () => {
            setShowAddModal(false)
            setEditingOpp(null)
            setHorizonSeed(null)
            await refreshOpps()
          }}
        />
      )}
      {scoringOpp && (
        <ScorePanel
          opp={scoringOpp}
          onClose={() => setScoringOpp(null)}
          onSave={async updated => {
            setScoringOpp(null)
            setOpps(prev => prev.map(o => (o.id === updated.id ? updated : o)))
          }}
        />
      )}
    </div>
  )
}

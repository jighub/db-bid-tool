'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { HorizonItem, Opportunity, Stage } from '@/lib/types'
import PipelineView from './PipelineView'
import OpportunitiesTable from './OpportunitiesTable'
import HorizonView from './HorizonView'
import OppModal from './OppModal'
import BidProfile from './BidProfile'
import Tooltip, { InfoIcon } from './Tooltip'

type Tab = 'pipeline' | 'horizon'
type PipelineView2 = 'board' | 'list'

const NAV_TOOLTIPS: Record<Tab, string> = {
  pipeline: 'Your active bids organised by stage — from first look through to won or lost.',
  horizon: 'Future events 1–2 years out. "For Review" means it\'s time to reach out. "On the Radar" means watch and wait.',
}

interface Props {
  initialOpportunities: Opportunity[]
}

export default function BidTool({ initialOpportunities }: Props) {
  const [tab, setTab] = useState<Tab>('pipeline')
  const [pipelineView, setPipelineView] = useState<PipelineView2>('board')
  const [opps, setOpps] = useState<Opportunity[]>(initialOpportunities)
  const [showAddModal, setShowAddModal] = useState(false)
  const [horizonSeed, setHorizonSeed] = useState<HorizonItem | null>(null)
  const [profileOpp, setProfileOpp] = useState<Opportunity | null>(null)
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
        setRefreshStatus(`Found ${json.added} new opportunities`)
        await refreshOpps()
      } else if (res.ok) {
        setRefreshStatus('No new opportunities found')
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

  const navItems: { id: Tab; label: string }[] = [
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'horizon', label: 'Horizon' },
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
                className="px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap flex items-center"
                style={
                  tab === id
                    ? { color: '#0a3354', borderBottom: '3px solid #fdb528', fontWeight: 600 }
                    : { color: '#64748b', borderBottom: '3px solid transparent' }
                }
              >
                {label}
                <Tooltip text={NAV_TOOLTIPS[id]} direction="down">
                  <InfoIcon />
                </Tooltip>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 py-2">
            {refreshStatus && (
              <span className="text-xs text-slate-500 max-w-[200px] truncate">{refreshStatus}</span>
            )}
            {tab === 'pipeline' && (
              <>
                <div className="flex rounded-full overflow-hidden border border-slate-200 text-xs font-semibold">
                  {(['board', 'list'] as PipelineView2[]).map(v => (
                    <button
                      key={v}
                      onClick={() => setPipelineView(v)}
                      className="px-3 py-1.5 transition-colors capitalize"
                      style={
                        pipelineView === v
                          ? { backgroundColor: '#0a3354', color: '#fff' }
                          : { backgroundColor: '#fff', color: '#64748b' }
                      }
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <button
                  onClick={runRefresh}
                  disabled={refreshing}
                  title="Ask Claude to scan for new bid opportunities"
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5"
                  style={{ backgroundColor: '#f1f5f9', color: '#0a3354', border: '1px solid #cbd5e1' }}
                >
                  <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </>
            )}
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
        {tab === 'pipeline' && pipelineView === 'board' && (
          <PipelineView
            opps={opps.filter(o => o.is_reviewed)}
            onMoveStage={moveStage}
            onOpenProfile={opp => setProfileOpp(opp)}
            onDelete={deleteOpp}
          />
        )}
        {tab === 'pipeline' && pipelineView === 'list' && (
          <OpportunitiesTable
            opps={opps.filter(o => o.is_reviewed)}
            onOpenProfile={opp => setProfileOpp(opp)}
            onDelete={deleteOpp}
            onMoveStage={moveStage}
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
      </div>

      {/* Modals */}
      {(showAddModal) && (
        <OppModal
          horizonSeed={horizonSeed ?? undefined}
          onClose={() => {
            setShowAddModal(false)
            setHorizonSeed(null)
          }}
          onSave={async () => {
            setShowAddModal(false)
            setHorizonSeed(null)
            await refreshOpps()
          }}
        />
      )}

      {profileOpp && (
        <BidProfile
          opp={profileOpp}
          onClose={() => setProfileOpp(null)}
          onSave={async updated => {
            setProfileOpp(updated)
            setOpps(prev => prev.map(o => (o.id === updated.id ? updated : o)))
          }}
          onDelete={async id => {
            setProfileOpp(null)
            await deleteOpp(id)
          }}
          onMoveStage={async (id, stage) => {
            await moveStage(id, stage)
            setProfileOpp(prev => prev ? { ...prev, stage } : null)
          }}
        />
      )}
    </div>
  )
}

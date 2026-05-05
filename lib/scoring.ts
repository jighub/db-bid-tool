import type { Scores } from './types'

export const SCORE_MAX = {
  overnight_stay: 25,
  local_alignment: 20,
  venue_fit: 20,
  economic_impact: 15,
  competitiveness: 10,
  lead_time: 10,
}

export const SCORE_LABELS = {
  overnight_stay: 'Overnight Stay Potential',
  local_alignment: 'Local Club / Org Alignment',
  venue_fit: 'Venue Fit',
  economic_impact: 'Economic Impact',
  competitiveness: 'Competitiveness',
  lead_time: 'Lead Time (auto)',
}

export function calcLeadTime(bidDeadline: string | null): number {
  if (!bidDeadline) return 5
  const days = Math.floor(
    (new Date(bidDeadline).getTime() - Date.now()) / 86_400_000
  )
  if (days > 180) return 10
  if (days > 90) return 8
  if (days > 45) return 5
  if (days > 0) return 2
  return 0
}

export function calcTotal(scores: Scores, bidDeadline: string | null): number {
  return (
    (scores.overnight_stay ?? 0) +
    (scores.local_alignment ?? 0) +
    (scores.venue_fit ?? 0) +
    (scores.economic_impact ?? 0) +
    (scores.competitiveness ?? 0) +
    calcLeadTime(bidDeadline)
  )
}

export function getRecommendation(total: number): 'Pursue' | 'Consider' | 'Pass' {
  if (total >= 70) return 'Pursue'
  if (total >= 45) return 'Consider'
  return 'Pass'
}

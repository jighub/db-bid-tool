export type EventType = 'sporting' | 'cultural' | 'conference' | 'other'
export type Stage = 'prospecting' | 'in-progress' | 'submitted' | 'won' | 'lost'
export type Source = 'manual' | 'curated' | 'ai_discovery'

export type AssetTag =
  | 'innovation_plex'
  | 'jackfish_lodge'
  | 'table_mountain'
  | 'curling_club'
  | 'disc_golf'
  | 'archery'
  | 'snowmobile'
  | 'aquatic'
  | 'soccer_fields'
  | 'golf_course'

export const ASSET_LABELS: Record<AssetTag, string> = {
  innovation_plex: 'Innovation Plex',
  jackfish_lodge: 'Jackfish Lodge',
  table_mountain: 'Table Mountain',
  curling_club: 'Curling Club',
  disc_golf: 'Disc Golf',
  archery: 'Archery',
  snowmobile: 'Snowmobile',
  aquatic: 'Aquatic',
  soccer_fields: 'Soccer Fields',
  golf_course: 'Golf Course',
}

export const STAGE_LABELS: Record<Stage, string> = {
  prospecting: 'Prospecting',
  'in-progress': 'In Progress',
  submitted: 'Submitted',
  won: 'Won',
  lost: 'Lost',
}

export interface Scores {
  overnight_stay?: number    // 0–25
  local_alignment?: number   // 0–20
  venue_fit?: number         // 0–20
  economic_impact?: number   // 0–15
  competitiveness?: number   // 0–10
  // lead_time is derived, not stored (0–10)
}

export interface BidDocument {
  name: string
  url: string
}

export interface Opportunity {
  id: string
  event_name: string
  governing_body: string
  event_type: EventType
  typical_attendance: number | null
  bid_deadline: string | null
  event_start: string | null
  event_end: string | null
  indoor_capacity_needed: number | null
  accommodation_rooms_needed: number | null
  outdoor_notes: string | null
  url: string | null
  notes: string | null
  strategic_fit: string | null
  key_requirements: string | null
  outreach_by: string | null
  documents: BidDocument[]
  stage: Stage
  assets: AssetTag[]
  bha_overnight_priority: boolean
  city_venue_priority: boolean
  local_club_priority: boolean
  scores: Scores
  source: Source
  is_reviewed: boolean
  discovery_run_id: string | null
  created_at: string
  updated_at: string
}

export interface DiscoveryRun {
  id: string
  ran_at: string
  events_found: number
  prompt_used: string | null
  status: 'running' | 'completed' | 'failed'
  error: string | null
}

export interface HorizonRun {
  id: string
  status: 'running' | 'completed' | 'failed'
  items_found: number
  error: string | null
  created_at: string
}

export interface HorizonItem {
  id: string
  run_id: string | null
  event_name: string
  governing_body: string
  governing_body_website: string | null
  event_type: EventType
  typical_attendance: number | null
  estimated_event_year: number | null
  estimated_bid_window: string | null
  outreach_by: string | null
  strategic_fit: string | null
  key_requirements: string | null
  assets: AssetTag[]
  bha_overnight_priority: boolean
  city_venue_priority: boolean
  local_club_priority: boolean
  dismissed: boolean
  created_at: string
}

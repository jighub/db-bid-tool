@AGENTS.md

# Event Bid Management Tool — Destination Battlefords

## What this is
A Next.js web app for Destination Battlefords to track, score, and manage event bid opportunities. Built as a demo for their DMO contract. Live at **bid-tool-db.netlify.app** (auto-publish is locked — preview at main--bid-tool-db.netlify.app before publishing).

GitHub: `jighub/db-bid-tool`

## Local dev
```bash
cd "/Users/frankdavalos/Documents/Claude/Projects/Destination Battlefords/bid-tool"
npm run dev   # runs on port 3002 (3000/3001 taken by other projects)
```
Env vars are in `.env.local` (not committed). Required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

## Tech stack
- **Next.js** (App Router, `force-dynamic` on page.tsx to prevent build-time Supabase crash)
- **Supabase** (Postgres) — Jig Studio project ID: `mioasmojnduinbvhukew`
- **Tailwind CSS v4** with `@theme inline` custom DB brand colors
- **Anthropic SDK** — claude-sonnet-4-6 for AI discovery (switched from Opus due to Netlify timeout)
- **Netlify** via `@netlify/plugin-nextjs`, function timeout set to 30s

## Brand
- Navy: `#0a3354`, Gold: `#fdb528`, Mid: `#1a5c8a`, Light: `#7da8c4`
- Font: Inter
- Two-bar header: navy top bar (logo + site name) + white sub-bar (tool name + tagline)

## Database tables (all prefixed `bid_`)
### `bid_opportunities`
Main pipeline table. Key fields:
- `stage`: prospecting | in-progress | submitted | won | lost
- `source`: manual | curated | ai_discovery
- `is_reviewed`: false = pending review queue (for AI-discovered items)
- `scores`: JSONB with 5 criteria (see Scoring below)
- `assets`: text[] of asset tags
- `bha_overnight_priority`, `city_venue_priority`, `local_club_priority`: boolean flags
- Demo in-progress cards: `notes` starting with `[DEMO PLACEHOLDER]` → purple border + badge

### `bid_discovery_runs` / `bid_horizon_runs`
Track AI scan runs (status: running | completed | failed).

### `bid_horizon_items`
Forward-looking 2027–2028 opportunities from the Horizon tab. Fields:
- `estimated_event_year`, `estimated_bid_window`, `outreach_by` (date)
- `strategic_fit`, `key_requirements`
- `dismissed`: bool (soft delete)

## Scoring system (100 pts total)
| Criterion | Max | Stored |
|---|---|---|
| overnight_stay | 25 | ✓ |
| local_alignment | 20 | ✓ |
| venue_fit | 20 | ✓ |
| economic_impact | 15 | ✓ |
| competitiveness | 10 | ✓ |
| lead_time | 10 | derived from bid_deadline |

`calcTotal()` in `lib/scoring.ts`. Lead time: >180d=10, >90d=8, >45d=5, >0d=2, past=0.
Recommendations: Pursue ≥70, Consider 45–69, Pass <45.

## Asset tags
`innovation_plex`, `jackfish_lodge`, `table_mountain`, `curling_club`, `disc_golf`, `archery`, `snowmobile`, `aquatic`, `soccer_fields`, `golf_course`

## Key files
- `app/page.tsx` — server component, fetches opportunities, `force-dynamic`
- `app/globals.css` — Tailwind v4 theme with DB colors
- `components/BidTool.tsx` — main shell, tab state, refresh/scan logic
- `components/PipelineView.tsx` — kanban by stage
- `components/OpportunitiesTable.tsx` — table view
- `components/DiscoveryView.tsx` — pending review queue
- `components/HorizonView.tsx` — 1–2 year forward pipeline (Scan for Opportunities)
- `components/OppModal.tsx` — add/edit opportunity (accepts `horizonSeed` to pre-fill from Horizon)
- `components/ScorePanel.tsx` — 5 sliders + read-only lead time
- `components/ResourcesView.tsx` — static resources tab
- `components/Header.tsx` — two-bar DB branded header
- `lib/types.ts` — all TypeScript types incl. HorizonItem
- `lib/scoring.ts` — calcTotal, calcLeadTime, getRecommendation
- `lib/supabase.ts` — client singleton
- `app/api/discover/route.ts` — POST, AI scan → bid_opportunities (is_reviewed=false)
- `app/api/horizon/route.ts` — POST, AI scan → bid_horizon_items (2027–2028 focus)

## Strategic priorities (inform AI prompts)
1. BHA: overnight stays / "heads in beds" — multi-day tournaments & conferences
2. City: Innovation Plex utilization (2,000+ cap arena)
3. Local clubs: Twin Rivers Curling, Battlefords Disc Golf, Battle River Archers, Trail Breakers
4. Four-season balance: winter (curling, hockey), summer (disc golf, soccer, golf), fall (conferences)
5. Canadian Sports Tourism Alliance (CSTA) network events preferred

## Deployment
- Auto-publish is LOCKED on Netlify — new deploys go to preview, must manually publish
- Push to `main` → triggers build → check preview at `main--bid-tool-db.netlify.app`
- Netlify site ID: `c473dc0e-9ff2-4d1b-b389-f4aa1fc54063`
- Env vars set on Netlify for all 3 required keys

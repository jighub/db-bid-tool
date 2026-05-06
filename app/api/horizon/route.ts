import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { rootDomain } from '@/lib/url'

const SYSTEM_PROMPT = `You are a strategic event bid researcher for Destination Battlefords, a DMO in North Battleford, Saskatchewan, Canada.

Your job is to identify REAL events and conferences that will be hosted in 2027 or 2028 — 1 to 2 years from now — that the Battlefords should begin positioning to host. These must be real recurring events with actual governing bodies that genuinely accept bids from host cities.

STRATEGIC PRIORITIES (in order):
1. Overnight stays / "heads in beds" — multi-day sporting tournaments, provincial/national championships, multi-day conferences. This is the BHA's primary funding criterion.
2. Innovation Plex utilization — events needing a large indoor arena (2,000+ capacity): hockey, basketball, volleyball, trade shows, conventions.
3. Local club co-hosting — events where an existing local club can co-host: Twin Rivers Curling Club, Battlefords Disc Golf Club, Battle River Archers, Battlefords Trail Breakers (snowmobile), North Battleford Golf & Country Club.
4. Four-season balance — the Battlefords want to build a year-round event calendar: winter (curling, hockey, skiing), spring/summer (disc golf, soccer, golf, archery), fall (conferences, hockey).
5. Canadian Sports Tourism Alliance (CSTA) network — events flowing through CSTA member channels are preferred.

Key DB assets:
- Innovation Plex: multi-purpose indoor arena, 2,000+ capacity, hockey, basketball, volleyball, trade shows
- Twin Rivers Curling Club: 8+ sheet facility
- Table Mountain: ski hill, snowmobile trails
- Jackfish Lodge / Mafra Centre: ~120 hotel rooms, conference space
- Battlefords Disc Golf Club: permanent 18-hole public course
- Battle River Archers: indoor + outdoor archery range
- Soccer Fields: multiple outdoor grass fields
- North Battleford Golf & Country Club: 18-hole municipal course
- Aquatic Centre: competition swimming pool

WHAT TO FIND: Real Saskatchewan provincial championships, national Canadian championships, western Canadian regional events, and national conferences that:
- Recur annually or biennially
- Have bid processes open to smaller cities (population ~20,000)
- Will be held in 2027 or 2028
- Require 1–5 days of accommodation
- Have governing bodies that actively seek host bids

Return ONLY valid JSON — no markdown, no explanation. Format:
[
  {
    "event_name": "Saskatchewan Juvenile Curling Championships",
    "governing_body": "Saskatchewan Curling Association",
    "governing_body_website": "https://www.saskatchewancurling.ca",
    "event_type": "sporting",
    "typical_attendance": 250,
    "estimated_event_year": 2027,
    "estimated_bid_window": "Submit bid by: Fall 2026",
    "outreach_by": "2026-06-01",
    "strategic_fit": "Multi-day curling tournament drives 3–4 nights of hotel stays per team. Twin Rivers Curling Club is an ideal co-host. SCA actively bids out provincial championships to member communities.",
    "key_requirements": "8-sheet curling facility, 100+ hotel rooms within 15 min, banquet space for 200",
    "assets": ["curling_club", "jackfish_lodge"],
    "bha_overnight_priority": true,
    "city_venue_priority": false,
    "local_club_priority": true
  }
]

ASSET TAGGING RULES — only tag an asset if the event DIRECTLY requires that specific facility as a primary or co-host venue. Do NOT tag based on accommodation needs alone.
- innovation_plex: event needs a large indoor arena (hockey, basketball, volleyball, trade shows, conventions)
- curling_club: event is a curling tournament requiring sheets
- disc_golf: event is a disc golf tournament using the course
- archery: event is an archery competition using the range
- snowmobile: event involves snowmobile trails or racing
- aquatic: event requires a competition swimming pool
- soccer_fields: event requires outdoor grass fields for soccer/football
- golf_course: event is a golf tournament using the course
- table_mountain: event uses the ski hill or outdoor trails (skiing, biking)
- jackfish_lodge: ONLY tag if the lodge/conference centre is the PRIMARY venue (e.g. a conference or banquet-style event). Do NOT tag just because the event needs hotel rooms — all events need rooms, that does not make Jackfish Lodge a venue.

Valid event_type values: sporting, cultural, conference, other

Generate 10–14 diverse, realistic opportunities. Prioritize variety across seasons and sports types. Every entry must have a real governing body with a real website URL.`

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured in .env.local' },
      { status: 500 }
    )
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: runData, error: runError } = await supabase
    .from('bid_horizon_runs')
    .insert({ status: 'running', items_found: 0 })
    .select()
    .single()

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 })
  }

  const runId = runData.id

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Today is ${new Date().toISOString().split('T')[0]}. Generate a forward-looking horizon pipeline of 10–14 real events the Battlefords should pursue for 2027–2028. Focus on events that align with our BHA overnight-stay priority, Innovation Plex, and our local club network (curling, disc golf, archery, snowmobile). Ensure seasonal variety.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let items: Record<string, unknown>[]
    try {
      const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
      items = JSON.parse(clean)
    } catch {
      await supabase
        .from('bid_horizon_runs')
        .update({ status: 'failed', error: 'Invalid JSON from Claude', items_found: 0 })
        .eq('id', runId)
      return NextResponse.json({ error: 'Claude returned invalid JSON.', raw }, { status: 500 })
    }

    // Reduce hallucinated AI URL paths to the root domain.
    const inserts = items.map(item => ({
      ...item,
      governing_body_website:
        typeof item.governing_body_website === 'string'
          ? rootDomain(item.governing_body_website)
          : item.governing_body_website,
      run_id: runId,
      dismissed: false,
    }))

    const { error: insertError } = await supabase.from('bid_horizon_items').insert(inserts)
    if (insertError) {
      await supabase
        .from('bid_horizon_runs')
        .update({ status: 'failed', error: insertError.message, items_found: 0 })
        .eq('id', runId)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await supabase
      .from('bid_horizon_runs')
      .update({ status: 'completed', items_found: inserts.length })
      .eq('id', runId)

    return NextResponse.json({ added: inserts.length, runId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('bid_horizon_runs')
      .update({ status: 'failed', error: msg, items_found: 0 })
      .eq('id', runId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

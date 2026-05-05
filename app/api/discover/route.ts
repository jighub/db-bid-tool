import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are an event bid research assistant for Destination Battlefords, a DMO in Saskatchewan, Canada.

The Battlefords (North Battleford + Battleford) have these key assets for hosting events:
- Innovation Plex: large multi-purpose indoor arena (capacity 2,000+), hockey, basketball, volleyball, trade shows
- Battlefords Curling Club: multi-sheet curling facility (8+ sheets)
- Table Mountain: ski hill, snowmobile trails, outdoor recreation
- Jackfish Lodge / Battlefords Mafra Centre: hotel and conference centre (~120 rooms, meeting space)
- Disc Golf Course: permanent 18-hole public course
- Archery Facility: indoor and outdoor range
- Soccer Fields: multiple outdoor grass fields suitable for tournaments
- Golf Course: championship-calibre 18-hole municipal course
- Aquatic Centre: competition swimming pool

Funder priorities:
- BHA (Battlefords Hotel Association): events that require overnight stays (sports tournaments, multi-day conferences)
- City: events that use the Innovation Plex or other city-owned venues
- Local clubs: events where an existing local curling/disc golf/archery/hockey club can be a co-host

You will return a JSON array of 8–12 event bid opportunities that the Battlefords should seriously consider pursuing. Each must be a REAL category of event with a real governing body. Focus on provincial (Saskatchewan), national Canadian, and regional western Canadian events.

Return ONLY valid JSON — no markdown, no explanation. Format:
[
  {
    "event_name": "Saskatchewan Senior Curling Championships",
    "governing_body": "Saskatchewan Curling Association",
    "event_type": "sporting",
    "typical_attendance": 300,
    "bid_deadline": "2026-10-01",
    "event_start": "2027-02-01",
    "event_end": "2027-02-05",
    "accommodation_rooms_needed": 60,
    "indoor_capacity_needed": 800,
    "url": "https://www.saskatchewancurling.ca",
    "notes": "SCA holds annual bidding in fall for the following year. Strong fit for Battlefords Curling Club.",
    "assets": ["curling_club", "innovation_plex"],
    "bha_overnight_priority": true,
    "city_venue_priority": false,
    "local_club_priority": true,
    "scores": {
      "overnight_stay": 20,
      "local_alignment": 18,
      "venue_fit": 18,
      "economic_impact": 10,
      "competitiveness": 7
    }
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

Valid event_type values: sporting, cultural, conference, other`

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

  // Create a discovery run record
  const { data: runData, error: runError } = await supabase
    .from('bid_discovery_runs')
    .insert({ status: 'running', events_found: 0 })
    .select()
    .single()

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 })
  }

  const runId = runData.id

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate a fresh list of 8–12 event bid opportunities for Destination Battlefords. Focus on events that would drive overnight hotel stays and make use of the Innovation Plex, curling club, disc golf, or Table Mountain. Today is ${new Date().toISOString().split('T')[0]}.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    let opportunities: Record<string, unknown>[]
    try {
      // Strip any accidental markdown fences
      const clean = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
      opportunities = JSON.parse(clean)
    } catch {
      await supabase
        .from('bid_discovery_runs')
        .update({ status: 'failed', error: 'Invalid JSON from Claude', events_found: 0 })
        .eq('id', runId)
      return NextResponse.json({ error: 'Claude returned invalid JSON.', raw }, { status: 500 })
    }

    // Insert each opportunity
    const inserts = opportunities.map(opp => ({
      ...opp,
      source: 'ai_discovery',
      is_reviewed: false,
      discovery_run_id: runId,
      scores: opp.scores ?? {},
    }))

    const { error: insertError } = await supabase.from('bid_opportunities').insert(inserts)
    if (insertError) {
      await supabase
        .from('bid_discovery_runs')
        .update({ status: 'failed', error: insertError.message, events_found: 0 })
        .eq('id', runId)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    await supabase
      .from('bid_discovery_runs')
      .update({ status: 'completed', events_found: inserts.length })
      .eq('id', runId)

    return NextResponse.json({ added: inserts.length, runId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await supabase
      .from('bid_discovery_runs')
      .update({ status: 'failed', error: msg, events_found: 0 })
      .eq('id', runId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

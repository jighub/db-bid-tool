'use client'

interface Props {
  onClose: () => void
}

const SECTIONS = [
  {
    title: 'What is this tool?',
    content: `This is Destination Battlefords' event bid management system. It helps you track which events you're pursuing, score their strategic fit, and stay ahead of 1–2 year forward-looking opportunities.`,
  },
  {
    title: 'Pipeline tab',
    content: `The Pipeline tab shows your active bids in two views:\n\n• Board — a kanban-style column view organised by stage (Prospecting → In Progress → Submitted → Won/Lost). Click any card to open the full bid profile.\n\n• List — a filterable table of all bids. Click a row to open the profile. Use the stage dropdown inline to move a bid without opening it.`,
  },
  {
    title: 'Bid Profile',
    content: `Clicking a bid card opens the Bid Profile panel on the right. It has four sections:\n\n• Overview — core event details, priority flags, and venue/asset tags.\n• Strategy — why this event is a good fit for DB, and key hosting requirements.\n• Score — adjust the five scoring criteria. Lead time is calculated automatically from the bid deadline.\n• Documents — add links to RFPs, supporting files, or bid submissions.\n\nEdits are only saved when you click "Save Changes".`,
  },
  {
    title: 'Scoring and recommendations',
    content: `Each bid is scored out of 100 across five criteria:\n\n• Overnight Stay (25 pts) — multi-day events that drive room nights.\n• Local Alignment (20 pts) — fits DB's strategic priorities and existing clubs.\n• Venue Fit (20 pts) — matches available venues and capacities.\n• Economic Impact (15 pts) — estimated spend and spinoff.\n• Competitiveness (10 pts) — realistic chance of winning.\n• Lead Time (10 pts) — auto-calculated from bid deadline.\n\nRecommendations: Pursue ≥70, Consider 45–69, Pass <45.`,
  },
  {
    title: 'Horizon tab',
    content: `The Horizon tab shows 1–2 year forward-looking opportunities. Click "Scan for Opportunities" to have AI identify real events that DB should start positioning for.\n\n• For Review — outreach is due within 90 days. These need attention now.\n• On the Radar — more than 90 days out. Monitor and wait.\n\nUse "→ Push to Prospects" to move a horizon item into the Pipeline as a Prospecting bid.`,
  },
  {
    title: 'Adding bids manually',
    content: `Click "+ Add" in the top-right of the nav bar to add a bid manually. You can fill in as much or as little detail as you have — everything can be edited later via the Bid Profile.`,
  },
  {
    title: 'Refresh (AI Discovery)',
    content: `On the Pipeline tab, the "Refresh" button asks AI to scan for new bid opportunities based on DB's strategic priorities. New bids are added directly to Prospecting. This is separate from the Horizon scan — Refresh finds near-term opportunities, Horizon finds 1–2 year forward-looking ones.`,
  },
]

export default function HowToUse({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white h-full w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ backgroundColor: '#0a3354' }}>
          <div>
            <h2 className="text-base font-bold text-white">How to Use</h2>
            <p className="text-xs mt-0.5" style={{ color: '#7da8c4' }}>Event Bid Management Tool</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-sm font-bold text-slate-800 mb-2">{section.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full text-sm font-semibold py-2 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#0a3354', color: '#fff' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

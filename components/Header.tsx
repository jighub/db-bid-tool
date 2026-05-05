export default function Header() {
  return (
    <header>
      <div className="bg-white" style={{ borderBottom: '1px solid #e8edf2' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <a
            href="https://www.battlefords.ca"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Destination Battlefords — back to main site"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.prod.website-files.com/6601f7c74baedef5e44011da/661eb153869437dc25618e99_DB%20Color.svg"
              alt="Destination Battlefords"
              style={{ height: '40px', width: 'auto' }}
            />
          </a>
          <span className="text-xs text-slate-400 hidden sm:block">
            Destination Battlefords DMO
          </span>
        </div>
      </div>

      <div style={{ backgroundColor: '#0a3354' }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded shrink-0"
              style={{ backgroundColor: '#fdb528', color: '#0a3354' }}
            >
              DMO Tool
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none tracking-tight">
                Event Bid Management
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#7da8c4' }}>
                Destination Battlefords
              </p>
            </div>
          </div>
          <p className="text-xs hidden sm:block" style={{ color: '#5d8ca8' }}>
            Track, score &amp; manage event bid opportunities
          </p>
        </div>
      </div>
    </header>
  )
}

const GOVERNING_BODIES = [
  {
    category: 'Curling',
    orgs: [
      { name: 'Curling Canada', url: 'https://www.curling.ca', notes: 'National championships, Scotties, Brier' },
      { name: 'Saskatchewan Curling Association (SCA)', url: 'https://www.saskatchewancurling.ca', notes: 'Provincial events, club bonspiels' },
    ],
  },
  {
    category: 'Hockey',
    orgs: [
      { name: 'Hockey Saskatchewan', url: 'https://www.hockeysask.ca', notes: 'Provincial tournaments across all divisions' },
      { name: 'Hockey Canada', url: 'https://www.hockeycanada.ca', notes: 'National championships, U18, U15, Junior' },
    ],
  },
  {
    category: 'Basketball',
    orgs: [
      { name: 'Basketball Saskatchewan', url: 'https://www.basketballsaskatchewan.ca', notes: 'Provincial tournaments' },
      { name: 'Canada Basketball', url: 'https://www.basketball.ca', notes: 'National championships' },
    ],
  },
  {
    category: 'Volleyball',
    orgs: [
      { name: 'Volleyball Saskatchewan', url: 'https://www.volleyballsask.ca', notes: 'Provincial school and club events' },
      { name: 'Volleyball Canada', url: 'https://www.volleyball.ca', notes: 'National club championships' },
    ],
  },
  {
    category: 'Badminton',
    orgs: [
      { name: 'Badminton Saskatchewan', url: 'https://www.badmintonsask.ca', notes: 'Provincial championships' },
      { name: 'Badminton Canada', url: 'https://www.badmintoncanada.com', notes: 'National senior and junior titles' },
    ],
  },
  {
    category: 'Wrestling',
    orgs: [
      { name: 'Wrestling Saskatchewan', url: 'https://www.wrestlingsask.ca', notes: 'Provincial meets and invitationals' },
    ],
  },
  {
    category: 'Disc Golf',
    orgs: [
      { name: 'Disc Golf Canada', url: 'https://discgolfcanada.com', notes: 'Canadian Championships, invitational events' },
      { name: 'PDGA (Professional Disc Golf Association)', url: 'https://www.pdga.com', notes: 'Sanctioned events and world rankings' },
    ],
  },
  {
    category: 'Archery',
    orgs: [
      { name: 'Archery Canada', url: 'https://www.archerycanada.ca', notes: 'Provincial and national field/target events' },
    ],
  },
  {
    category: 'Golf',
    orgs: [
      { name: 'Golf Saskatchewan', url: 'https://www.golfsask.ca', notes: 'Provincial amateur championships' },
      { name: 'Golf Canada', url: 'https://www.golfcanada.ca', notes: 'Amateur, senior, junior national championships' },
    ],
  },
  {
    category: 'Snowmobile / Motorsports',
    orgs: [
      { name: 'Snowmobile Saskatchewan', url: 'https://www.snowmobilesask.ca', notes: 'Club rallies and provincial rides' },
    ],
  },
  {
    category: 'Skiing / Snow Sports',
    orgs: [
      { name: 'Alpine Canada', url: 'https://www.alpinecanada.org', notes: 'Alpine / Nordic national events' },
      { name: 'Nordiq Canada', url: 'https://www.nordiqcanada.ca', notes: 'Cross-country ski nationals' },
    ],
  },
  {
    category: 'Soccer',
    orgs: [
      { name: 'Saskatchewan Soccer Association', url: 'https://www.sasksoccer.com', notes: 'Provincial outdoor tournaments' },
      { name: 'Canada Soccer', url: 'https://www.canadasoccer.com', notes: 'National youth and adult championships' },
    ],
  },
  {
    category: 'Conferences & Events',
    orgs: [
      { name: 'Tourism Industry Association of Saskatchewan', url: 'https://www.tias.ca', notes: 'Provincial tourism conferences' },
      { name: 'Economic Developers Saskatchewan (EDAS)', url: 'https://www.edas.ca', notes: 'EDO conferences and AGMs' },
      { name: 'CivicInfo BC / Municipal orgs', url: '', notes: 'Municipal and regional governance conferences' },
    ],
  },
]

export default function ResourcesView() {
  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-800 mb-1">Governing Bodies & Contacts</h2>
        <p className="text-sm text-slate-500">
          Key organizations to contact for event bid opportunities in the Battlefords region.
        </p>
      </div>

      <div className="space-y-4">
        {GOVERNING_BODIES.map(({ category, orgs }) => (
          <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider"
              style={{ backgroundColor: '#0a3354', color: '#7da8c4' }}
            >
              {category}
            </div>
            <div className="divide-y divide-slate-100">
              {orgs.map(org => (
                <div key={org.name} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{org.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{org.notes}</p>
                  </div>
                  {org.url && (
                    <a
                      href={org.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs px-2.5 py-1 rounded font-medium hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}
                    >
                      Visit ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 mb-1">Key Battlefords Assets</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-amber-700">
          {[
            ['Innovation Plex', 'Multi-purpose indoor arena with large capacity'],
            ['Jackfish Lodge', 'Conference centre and hospitality venue'],
            ['Table Mountain', 'Ski hill and outdoor recreation area'],
            ['Battlefords Curling Club', 'Multi-sheet curling facility'],
            ['Disc Golf Course', 'Permanent public course'],
            ['Archery Facility', 'Indoor/outdoor archery range'],
            ['Soccer Fields', 'Multiple outdoor fields for tournaments'],
            ['Golf Course', 'Championship-calibre municipal course'],
          ].map(([asset, desc]) => (
            <div key={asset} className="bg-amber-100/50 rounded-lg px-3 py-2">
              <p className="font-semibold">{asset}</p>
              <p className="text-amber-600">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const SERVICES = [
  {
    name: 'K–12 Education',
    federal: 8,
    state: 65,
    local: 27,
    note: 'State formula aid dominates; local property taxes fund most of the local share. Federal funds (Title I, IDEA) are targeted at low-income students and students with disabilities.',
  },
  {
    name: 'Medicaid',
    federal: 65,
    state: 34,
    local: 1,
    note: 'Federal matching (FMAP) covers roughly two-thirds. NC counties contribute a small local share for certain services. This is the largest single driver of state budget growth.',
  },
  {
    name: 'Roads',
    federal: 25,
    state: 55,
    local: 20,
    note: 'NCDOT operates most roads statewide; municipalities maintain local streets. Federal highway funds flow through formula allocations tied to lane miles, population, and transit.',
  },
  {
    name: 'Community Colleges',
    federal: 5,
    state: 70,
    local: 25,
    note: 'NC counties sponsor each community college and fund local capital needs. State appropriations cover most operating costs. Federal funds are mainly Pell grants and workforce training.',
  },
]

function ServiceBar({ service }) {
  const { name, federal, state, local, note } = service
  return (
    <div className="wfw-row">
      <div className="wfw-label">{name}</div>
      <div className="wfw-bar-wrap">
        <div className="wfw-bar" role="img" aria-label={`${name}: Federal ${federal}%, State ${state}%, Local ${local}%`}>
          <div
            className="wfw-segment wfw-federal"
            style={{ flexBasis: `${federal}%` }}
            title={`Federal: ${federal}%`}
          >
            {federal >= 8 && <span className="wfw-pct">{federal}%</span>}
          </div>
          <div
            className="wfw-segment wfw-state"
            style={{ flexBasis: `${state}%` }}
            title={`State: ${state}%`}
          >
            {state >= 8 && <span className="wfw-pct">{state}%</span>}
          </div>
          <div
            className="wfw-segment wfw-local"
            style={{ flexBasis: `${local}%` }}
            title={`Local: ${local}%`}
          >
            {local >= 8 && <span className="wfw-pct">{local}%</span>}
          </div>
        </div>
        <p className="wfw-note">{note}</p>
      </div>
    </div>
  )
}

export default function WhoFundsWhat() {
  return (
    <section className="wfw-panel" aria-labelledby="wfw-heading">
      <div className="wfw-inner">
        <div className="wfw-header">
          <h2 className="wfw-heading" id="wfw-heading">Who Funds What?</h2>
          <p className="wfw-subhead">
            How major public services are financed across levels of government — statewide averages, approximate.
            The mix determines <em>which</em> level of government your taxes support and which level controls spending decisions.
          </p>
        </div>

        <div className="wfw-legend" aria-hidden="true">
          <span className="wfw-legend-item">
            <span className="wfw-legend-swatch wfw-federal" />Federal
          </span>
          <span className="wfw-legend-item">
            <span className="wfw-legend-swatch wfw-state" />State
          </span>
          <span className="wfw-legend-item">
            <span className="wfw-legend-swatch wfw-local" />Local
          </span>
        </div>

        <div className="wfw-services">
          {SERVICES.map(s => <ServiceBar key={s.name} service={s} />)}
        </div>

        <p className="wfw-caveat">
          Percentages are approximate statewide averages for NC; county-level splits vary.
          Sources: NCDPI, NC Office of State Budget and Management, NCDOT, NC Community College System, Medicaid.gov (SFY 2023).
        </p>
      </div>
    </section>
  )
}

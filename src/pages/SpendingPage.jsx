import { useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useAppState } from '../hooks/useAppState'
import { useAppData } from '../context/AppDataContext'
import { getTaxRecord } from '../lib/taxUtils'
import TaxToServices from '../components/TaxToServices'
import WhoFundsWhat from '../components/WhoFundsWhat'
import CountyDropdown from '../components/CountyDropdown'
import BracketButtons from '../components/BracketButtons'
import HousingToggle from '../components/HousingToggle'
import MunicipalityDropdown, { UNINCORPORATED } from '../components/MunicipalityDropdown'

const BRACKET_RANGES = {
  '$25K':   'under $25,000',
  '$50K':   '$25,000–$75,000',
  '$100K':  '$75,000–$150,000',
  '$200K+': 'over $150,000',
}

function computeMunicipalAddition(record, muniRate) {
  if (!record || !muniRate || muniRate === 0) return 0
  const countyBurden = record.taxes.property_tax?.annual_burden ?? 0
  const countyRate   = record.taxes.property_tax?.county_rate_per_100 ?? 0
  if (countyBurden === 0 || countyRate === 0) return 0
  const homeValue = (countyBurden * 100) / countyRate
  return Math.round((muniRate / 100) * homeValue)
}

export default function SpendingPage() {
  const { county, bracket, housing, muni, update } = useAppState()
  const [searchParams] = useSearchParams()
  const { data, municipalRates, localAllocs, loading } = useAppData()
  const [profileOpen, setProfileOpen] = useState(false)

  const counties = data ? Object.keys(data).sort() : []
  const effectiveCounty = counties.includes(county) ? county : (counties[0] ?? 'Mecklenburg')
  const selectedMuni = muni !== '' ? muni : null
  const municipalityValue = muni || UNINCORPORATED

  const muniRate = selectedMuni && municipalRates?.[effectiveCounty]
    ? (municipalRates[effectiveCounty].find(m => m.name === selectedMuni)?.rate ?? 0)
    : 0

  const record = data ? getTaxRecord(data, effectiveCounty, bracket, housing) : null
  const muniAddition = computeMunicipalAddition(record, muniRate)
  const countyAlloc = localAllocs?.[effectiveCounty] ?? null

  const housingLabel = housing === 'owner' ? 'a homeowner' : 'a renter'
  const rangeLabel   = BRACKET_RANGES[bracket] ?? bracket

  const handleCountyChange = nextCounty => {
    update({ county: nextCounty, muni: '' })
  }

  return (
    <main className="main-content">
      <section className="hero hero--sm">
        <h1 className="hero-headline">Where your taxes go</h1>
        <p className="hero-body">
          See how your estimated tax burden is distributed across public services at the federal, state, and local level.
        </p>
      </section>

      <div className="controls-bar" role="region" aria-label="Current household profile">
        <div className="controls-bar__inner">
          <p className="controls-summary">
            Showing estimates for {housingLabel} in {effectiveCounty} County
            {selectedMuni ? ` (${selectedMuni})` : ''}
            {' '}earning {rangeLabel}.
            {' '}
            <button
              type="button"
              className="change-link"
              aria-expanded={profileOpen}
              aria-controls="profile-panel"
              onClick={() => setProfileOpen(o => !o)}
            >
              {profileOpen ? 'Close' : 'Change profile'}
            </button>
          </p>

          {profileOpen && (
            <div id="profile-panel" className="controls-row" role="group" aria-label="Edit household profile">
              {loading ? (
                <div className="skeleton-select" aria-busy="true" aria-label="Loading counties" />
              ) : (
                <CountyDropdown counties={counties} value={effectiveCounty} onChange={handleCountyChange} />
              )}
              <HousingToggle value={housing} onChange={v => update({ housing: v })} />
              <BracketButtons value={bracket} onChange={v => update({ bracket: v })} />
              {!loading && municipalRates && (
                <MunicipalityDropdown
                  county={effectiveCounty}
                  municipalRates={municipalRates}
                  value={municipalityValue}
                  onChange={v => update({ muni: v === UNINCORPORATED ? '' : v })}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading…
        </div>
      )}

      {!loading && record && (
        <>
          <TaxToServices
            record={record}
            county={effectiveCounty}
            localAllocations={countyAlloc}
            municipalAddition={muniAddition}
          />
          <WhoFundsWhat />
          <div className="spending-cta spending-cta--methodology">
            <NavLink to="/methodology" className="spending-cta__link">
              How these estimates are calculated →
            </NavLink>
          </div>
        </>
      )}
    </main>
  )
}

import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAppState } from '../hooks/useAppState'
import { useAppData } from '../context/AppDataContext'
import { getTaxRecord, BRACKET_INCOMES } from '../lib/taxUtils'
import Disclaimer from '../components/Disclaimer'
import CountyDropdown from '../components/CountyDropdown'
import BracketButtons from '../components/BracketButtons'
import HousingToggle from '../components/HousingToggle'
import MunicipalityDropdown, { UNINCORPORATED } from '../components/MunicipalityDropdown'
import TaxStackedBar from '../components/TaxStackedBar'
import TaxSourceTreemap from '../components/TaxSourceTreemap'
import BracketComparePicker from '../components/BracketComparePicker'
import BracketCompareTable from '../components/BracketCompareTable'

const BRACKET_RANGES = {
  '$25K':   'under $25,000',
  '$50K':   '$25,000–$75,000',
  '$100K':  '$75,000–$150,000',
  '$200K+': 'over $150,000',
}

function getTaxSummaryHeading(record) {
  if (!record) return null
  const { taxes } = record
  const federal = (taxes.federal_income_tax?.annual_burden ?? 0) +
                  (taxes.payroll_tax?.annual_burden ?? 0)
  const stateTotal = (taxes.state_income_tax?.annual_burden ?? 0) +
                     (taxes.sales_tax_state?.annual_burden ?? 0)
  const localTotal = (taxes.property_tax?.annual_burden ?? 0) +
                     (taxes.sales_tax_local?.annual_burden ?? 0)
  const max = Math.max(federal, stateTotal, localTotal)
  if (max === federal) return 'Federal taxes account for the largest share of your burden.'
  if (max === stateTotal) return 'State taxes account for the largest share of your burden.'
  return 'Local taxes account for the largest share of your burden.'
}

function computeMunicipalAddition(record, muniRate) {
  if (!record || !muniRate || muniRate === 0) return 0
  const countyBurden = record.taxes.property_tax?.annual_burden ?? 0
  const countyRate   = record.taxes.property_tax?.county_rate_per_100 ?? 0
  if (countyBurden === 0 || countyRate === 0) return 0
  const homeValue = (countyBurden * 100) / countyRate
  return Math.round((muniRate / 100) * homeValue)
}

export default function CalculatorPage() {
  const { county, bracket, housing, muni, update } = useAppState()
  const [searchParams] = useSearchParams()
  const [compareBracket, setCompareBracket] = useState(null)
  const { data, municipalRates, localAllocs, loading, error } = useAppData()

  const counties = data ? Object.keys(data).sort() : []
  const effectiveCounty = counties.includes(county) ? county : (counties[0] ?? 'Mecklenburg')

  const handleCountyChange = nextCounty => {
    update({ county: nextCounty, muni: '' })
  }

  // Convert URL muni param to component value
  const municipalityValue = muni || UNINCORPORATED
  const selectedMuni = muni !== '' ? muni : null

  const muniRate = selectedMuni && municipalRates?.[effectiveCounty]
    ? (municipalRates[effectiveCounty].find(m => m.name === selectedMuni)?.rate ?? 0)
    : 0

  const record = data ? getTaxRecord(data, effectiveCounty, bracket, housing) : null
  const compareRecord = compareBracket && data
    ? getTaxRecord(data, effectiveCounty, compareBracket, housing)
    : null

  const muniAddition = computeMunicipalAddition(record, muniRate)
  const countyAlloc   = localAllocs?.[effectiveCounty] ?? null
  const bracketIncome = BRACKET_INCOMES[bracket] ?? 50_000
  const housingLabel  = housing === 'owner' ? 'a homeowner' : 'a renter'
  const rangeLabel    = BRACKET_RANGES[bracket] ?? bracket
  const resultKey = `${effectiveCounty}-${bracket}-${housing}-${selectedMuni ?? ''}`

  const summaryHeading = getTaxSummaryHeading(record)
  const totalBurden    = (record?.total?.annual_burden ?? 0) + muniAddition

  if (error) {
    return (
      <div className="app-error" role="alert">
        <p>
          Could not load tax data. Please try refreshing the page. If this problem persists,{' '}
          <a href="https://github.com/xgx755/nc-fiscal-explorer/issues">open an issue on GitHub</a>.
        </p>
      </div>
    )
  }

  return (
    <main className="main-content">
      <section className="hero">
        <h1 className="hero-headline">Where do my taxes go?</h1>
        <p className="hero-body">
          Calculate your estimated total tax burden across all levels of government and see which services are funded at which level.
        </p>
        <p className="hero-disclaimer">
          Estimates based on 2022–2026 tax data · Not affiliated with any government
        </p>
      </section>

      <div className="controls-bar" role="search" aria-label="Household profile">
        <div className="controls-bar__inner">
          <div className="controls-row">
            {loading ? (
              <div className="skeleton-select" aria-busy="true" aria-label="Loading counties" />
            ) : (
              <CountyDropdown counties={counties} value={effectiveCounty} onChange={handleCountyChange} />
            )}
            <HousingToggle value={housing} onChange={v => update({ housing: v })} />
            <BracketButtons
              value={bracket}
              onChange={v => { update({ bracket: v }); if (v === compareBracket) setCompareBracket(null) }}
            />
            {!loading && municipalRates && (
              <MunicipalityDropdown
                county={effectiveCounty}
                municipalRates={municipalRates}
                value={municipalityValue}
                onChange={v => update({ muni: v === UNINCORPORATED ? '' : v })}
              />
            )}
          </div>
          <p className="controls-summary">
            Showing estimates for {housingLabel} in {effectiveCounty} County
            {selectedMuni ? ` (${selectedMuni})` : ''}
            {' '}earning {rangeLabel}.
          </p>
        </div>
      </div>

      <div className="results-area">
        <Disclaimer />

        {loading && (
          <div className="skeleton-table" aria-busy="true" aria-label="Loading tax data">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        )}

        {!loading && record && (
          <div key={resultKey} className="results-animate">
            <section className="metric-section" aria-label="Total tax burden">
              <div
                className="metric-callout"
                aria-label={`Approximately ${Math.round(totalBurden / bracketIncome * 100)} percent of income`}
              >
                ~{Math.round(totalBurden / bracketIncome * 100)}% of income
              </div>
              <div className="metric-label">Total Estimated Tax Burden</div>
            </section>

            <section className="chart-section" aria-label="Tax burden breakdown chart">
              <h2 className="section-heading">{summaryHeading}</h2>
              <TaxStackedBar record={record} municipalAddition={muniAddition} />
            </section>

            <section className="chart-section" aria-label="Tax burden by source">
              <TaxSourceTreemap
                record={record}
                municipalAddition={muniAddition}
                housing={housing}
                bracket={bracket}
                bracketIncome={bracketIncome}
              />
            </section>

            <div className="compare-section">
              <BracketComparePicker
                value={compareBracket}
                primary={bracket}
                onChange={setCompareBracket}
              />
              {compareBracket && (
                <BracketCompareTable
                  record1={record}
                  record2={compareRecord}
                  bracket1={bracket}
                  bracket2={compareBracket}
                  housing={housing}
                />
              )}
            </div>

            <div className="spending-cta">
              <Link to={`/spending?${searchParams.toString()}`} className="spending-cta__link">
                See where it goes →
              </Link>
            </div>
          </div>
        )}

        {!loading && !record && data && (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '2rem 0' }}>
            No data available for this selection.
          </p>
        )}
      </div>
    </main>
  )
}

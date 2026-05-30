/**
 * TaxToServices.jsx
 * -----------------
 * Feature 1 + F6 + F7: "Your Taxes → Services" bar chart.
 *
 * Crosses user tax burden by level × budget allocation shares to show
 * estimated dollars flowing from this household to each public service.
 *
 * F6: Uses county-specific local allocations from county_local_allocations.json.
 * F7: "All Other" row is expandable to show local sub-categories.
 */

import { useState } from 'react'
import { getServiceAllocations, getLocalOtherBreakdown, formatCurrency } from '../lib/taxUtils'

// Neutral palette for service bars (not level-coded)
const SERVICE_COLOR = '#1a4480'
const SERVICE_COLOR_OTHER = '#8a9ab5'

function DataQualityFlag({ flag, county }) {
  const [open, setOpen] = useState(false)
  if (!flag || flag === 'ok') return null
  return (
    <span className="dq-flag">
      <button
        type="button"
        className="dq-flag__trigger"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        aria-label="Data quality note"
      >
        *
      </button>
      {open && (
        <span className="dq-flag__body" role="tooltip">
          {county} is not included in the NC DST AFIR FY2025 dataset. Local allocation uses statewide average.
        </span>
      )}
    </span>
  )
}

function OtherDrillDown({ serviceItem, localAllocations }) {
  const [open, setOpen] = useState(false)

  // Estimate the local portion of Other
  // The "amount" in serviceItem is the cross-level total; we need just the local component
  // We pass localAllocations and use a rough estimate for local portion only
  const breakdown = localAllocations
    ? getLocalOtherBreakdown(
        // Approximate local Other: serviceItem already blends local+state+federal
        // For the drill-down we show just the local component, labeled explicitly
        serviceItem._localOtherAmount ?? 0,
        localAllocations
      )
    : null

  if (!breakdown || serviceItem._localOtherAmount === 0) {
    return null
  }

  return (
    <div className="other-drilldown">
      <button
        type="button"
        className="drilldown-toggle"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        {open ? '▾' : '▸'} Local detail
      </button>
      {open && (
        <div className="drilldown-body">
          <p className="drilldown-note">
            Local sub-categories from NC DST County AFIR FY2025.
            State and federal components are not broken down further in this version.
          </p>
          <table className="drilldown-table">
            <tbody>
              {breakdown.map(sub => (
                <tr key={sub.key}>
                  <td className="drilldown-label">└ {sub.label} <span className="drilldown-scope">(local)</span></td>
                  <td className="drilldown-amount">{formatCurrency(sub.amount)}</td>
                </tr>
              ))}
              {serviceItem._stateFederalOtherAmount > 0 && (
                <tr>
                  <td className="drilldown-label">└ State &amp; Federal <span className="drilldown-scope">(not further itemized)</span></td>
                  <td className="drilldown-amount">{formatCurrency(serviceItem._stateFederalOtherAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TaxToServices({ record, county, localAllocations, municipalAddition = 0 }) {
  if (!record) return null

  const { taxes } = record
  const localTotal =
    (taxes.property_tax?.annual_burden ?? 0) +
    (taxes.sales_tax_local?.annual_burden ?? 0) +
    municipalAddition
  const stateTotal =
    (taxes.sales_tax_state?.annual_burden ?? 0) +
    (taxes.state_income_tax?.annual_burden ?? 0)
  const federalTotal =
    (taxes.federal_income_tax?.annual_burden ?? 0) +
    (taxes.payroll_tax?.annual_burden ?? 0)

  const { BUDGET_ALLOCATIONS_STATE, BUDGET_ALLOCATIONS_FEDERAL, BUDGET_ALLOCATIONS_LOCAL_FALLBACK } =
    import.meta.glob ? {} : {}

  const rawAllocations = getServiceAllocations(record, localAllocations, municipalAddition)
  if (!rawAllocations) return null

  // Sort: descending amount, Other always last
  const sorted = [...rawAllocations]
    .filter(s => s.key !== 'other')
    .sort((a, b) => b.amount - a.amount)

  const otherItem = rawAllocations.find(s => s.key === 'other')

  // Compute local Other amount for F7 drill-down
  const localAlloc = localAllocations ?? BUDGET_ALLOCATIONS_LOCAL_FALLBACK
  const localOtherShare = (typeof localAlloc === 'object' && localAlloc) ? (localAlloc.other ?? 0) : 0
  const localOtherAmount = Math.round(localTotal * localOtherShare)
  const stateFederalOtherAmount = otherItem
    ? Math.round(otherItem.amount - localOtherAmount)
    : 0

  if (otherItem) {
    otherItem._localOtherAmount = localOtherAmount
    otherItem._stateFederalOtherAmount = Math.max(0, stateFederalOtherAmount)
  }

  const allItems = [...sorted, ...(otherItem ? [otherItem] : [])]
  const maxAmount = Math.max(...allItems.map(s => s.amount), 1)
  const dataFlag = rawAllocations[0]?.localDataFlag ?? 'ok'

  return (
    <section className="tts-section" aria-labelledby="tts-heading">
      <h2 className="section-heading" id="tts-heading">
        Where your taxes go
      </h2>
      <p className="tts-subtitle">
        Estimated dollars from your tax burden going to each public service,
        based on budget allocation shares across all levels of government.
        <DataQualityFlag flag={dataFlag} county={county} />
      </p>

      {/* Accessible bar chart */}
      <div className="tts-chart" role="img" aria-label="Tax to services bar chart">
        {allItems.map(item => {
          const isOther = item.key === 'other'
          const barPct = (item.amount / maxAmount) * 100
          return (
            <div key={item.key} className={`tts-row${isOther ? ' tts-row--other' : ''}`}>
              <div className="tts-row__label">{item.label}</div>
              <div className="tts-row__bar-wrap">
                <div
                  className="tts-row__bar"
                  style={{
                    width: `${barPct}%`,
                    background: isOther ? SERVICE_COLOR_OTHER : SERVICE_COLOR,
                  }}
                  aria-hidden="true"
                />
              </div>
              <div className="tts-row__amount">
                {formatCurrency(item.amount)}
                <span className="tts-row__pct"> ({(item.pct * 100).toFixed(0)}%)</span>
              </div>
              {item.key === 'other' && (
                <OtherDrillDown
                  serviceItem={item}
                  localAllocations={localAllocations}
                />
              )}
              {item.key === 'roads' && localAlloc?.roads === 0 && (
                <p className="tts-road-note">
                  County road spending is not separately tracked in the AFIR and is included in
                  'All Other' at the local level.
                </p>
              )}
              {item.key === 'human_services' && (
                <p className="tts-hs-note">
                  At the local level, reflects county Human Services expenditures (Medicaid, DSS,
                  mental health, and related programs). At the state level, reflects primarily Medicaid.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Fallback table for screen readers */}
      <table className="sr-only" aria-label="Tax to services table">
        <thead>
          <tr><th>Service</th><th>Estimated Annual Amount</th><th>% of Total</th></tr>
        </thead>
        <tbody>
          {allItems.map(item => (
            <tr key={item.key}>
              <td>{item.label}</td>
              <td>{formatCurrency(item.amount)}</td>
              <td>{(item.pct * 100).toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="tts-note">
        These estimates show how your taxes are distributed across public services based on
        {dataFlag === 'ok'
          ? ` ${county} County's actual FY2025 expenditure data (local)`
          : ' statewide average budget allocations (local)'
        } and statewide averages (state, federal).
        'All Other Government Functions' includes Social Security, Medicare, defense, debt service
        (federal), and other programs not shown individually.
        Sources: OSBM FY2024 (state), NC DST County AFIR FY2025 (local), OMB Table 3.2 FY2023 (federal).
      </p>
    </section>
  )
}

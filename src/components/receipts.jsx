/**
 * receipts.jsx
 * ------------
 * Shared "How?" receipt pieces — InlineReceipt, SourceLinks, RenterTooltip,
 * and supporting copy/sources — used by both TaxBreakdownTable (Revenue page
 * table, legacy) and TaxSourceTreemap (Revenue page "Where your tax dollars
 * come from" rows).
 */

import { createPortal } from 'react-dom'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { formatCurrency } from '../lib/taxUtils'
import StateTaxTrendChart from './StateTaxTrendChart'

/* eslint-disable react-refresh/only-export-components */

export const PAYROLL_CAVEAT =
  "Employee share only. The employer's matching contribution (6.2% SS + 1.45% Medicare) is not shown; economists believe some portion falls on workers as lower wages, but this is contested and not modeled."

export const RENTER_TOOLTIP =
  "Economists generally assume landlords pass property tax costs on to renters through higher rents. In weaker rental markets, landlords may absorb some of this cost, so this estimate may be slightly high."

// ── Source links ──────────────────────────────────────────────────────────────

export const SOURCES = {
  property_tax: [
    { label: 'NCDOR County Tax Rates', url: 'https://www.ncdor.gov/taxes-forms/property-tax/county-and-municipal-property-tax-rates-and-latest-news' },
  ],
  state_income_tax: [
    { label: 'NCDOR Individual Income Tax', url: 'https://www.ncdor.gov/taxes-forms/individual-income-tax' },
    { label: 'NCGS § 105-153.5', url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_105/GS_105-153.5.html' },
  ],
  sales_tax_state: [
    { label: 'NCDOR Sales & Use Tax Rates', url: 'https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-rates-other-information' },
  ],
  sales_tax_local: [
    { label: 'NCDOR Sales & Use Tax Rates', url: 'https://www.ncdor.gov/taxes-forms/sales-and-use-tax/sales-and-use-tax-rates-other-information' },
  ],
  federal_income_tax: [
    { label: 'ITEP Who Pays Taxes in America', url: 'https://itep.org/whopays/' },
    { label: 'IRS SOI Tax Stats', url: 'https://www.irs.gov/statistics/soi-tax-stats-individual-statistical-tables-by-size-of-adjusted-gross-income' },
  ],
  payroll_tax: [
    { label: 'SSA Wage Base (2026)', url: 'https://www.ssa.gov/oact/cola/cbb.html' },
    { label: 'IRS Topic 751', url: 'https://www.irs.gov/taxtopics/tc751' },
  ],
}

export function SourceLinks({ taxKey }) {
  const links = SOURCES[taxKey]
  if (!links || links.length === 0) return null
  return (
    <span className="receipt-sources">
      {links.map((s, i) => (
        <span key={s.url}>
          {i > 0 && ' · '}
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="receipt-source-link">
            {s.label} ↗
          </a>
        </span>
      ))}
    </span>
  )
}

// ── InlineReceipt ─────────────────────────────────────────────────────────────

export function InlineReceipt({ taxKey, cell, income, housing, bracket, showTrend, onToggleTrend }) {
  if (!cell) return null

  let rows = []

  if (taxKey === 'property_tax') {
    const rate = cell.county_rate_per_100
    const homeValue = rate > 0 ? Math.round((cell.annual_burden * 100) / rate) : null
    if (housing === 'owner') {
      rows = [
        { label: 'County tax rate', value: `$${rate.toFixed(4)} per $100 assessed value` },
        { label: 'Estimated home value', value: homeValue ? formatCurrency(homeValue) : '—', note: 'ACS county median × bracket multiplier (ACS B25121)' },
        { label: 'Formula', value: homeValue ? `(${formatCurrency(homeValue)} ÷ 100) × $${rate.toFixed(4)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr` : '—', mono: true },
      ]
    } else {
      const rentalUnitValue = rate > 0 ? Math.round((cell.annual_burden * 100) / rate) : null
      rows = [
        { label: 'County tax rate', value: `$${rate.toFixed(4)} per $100 assessed value` },
        { label: 'Est. rental unit value', value: rentalUnitValue ? formatCurrency(rentalUnitValue) : '—', note: 'Annual gross rent ÷ 6% cap rate' },
        { label: 'Incidence assumption', value: 'Property tax assumed fully passed through in rent (standard public finance assumption)' },
        { label: 'Annual burden', value: formatCurrency(Math.round(cell.annual_burden)), mono: true },
      ]
    }
  }

  if (taxKey === 'state_income_tax') {
    const RATE = 3.99
    const STD_DED = 13000
    const taxable = Math.max(0, income - STD_DED)
    rows = [
      { label: 'NC flat rate (2026)', value: `${RATE}%` },
      { label: 'Standard deduction (single filer)', value: formatCurrency(STD_DED), note: 'NCGS § 105-153.5' },
      { label: 'Taxable income', value: `${formatCurrency(income)} − ${formatCurrency(STD_DED)} = ${formatCurrency(taxable)}` },
      { label: 'Formula', value: `${RATE}% × ${formatCurrency(taxable)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr`, mono: true },
      { label: 'Note', value: 'Uses single-filer standard deduction. Married filers receive a $26,000 deduction. No credits or itemized deductions modeled.' },
    ]
  }

  if (taxKey === 'sales_tax_state') {
    const STATE_RATE = 4.75
    const consumption = Math.round(cell.annual_burden / (STATE_RATE / 100))
    rows = [
      { label: 'NC state sales tax rate', value: `${STATE_RATE}%` },
      { label: 'Est. taxable consumption', value: formatCurrency(consumption), note: 'BLS Consumer Expenditure Survey 2024' },
      { label: 'Formula', value: `${STATE_RATE}% × ${formatCurrency(consumption)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr`, mono: true },
      { label: 'Note', value: 'Groceries taxed at 2.0% NC state rate only; general merchandise at 4.75%' },
    ]
  }

  if (taxKey === 'sales_tax_local') {
    // Simpler: back-calculate rate from annual_burden and consumption
    // We know state consumption = state_burden / 0.0475
    // local_burden = consumption * local_rate
    // So local_rate = local_burden / consumption
    // But we don't have consumption directly. Use effective_rate from JSON.
    const localRatePct = cell.effective_rate > 0 ? (cell.effective_rate * 100).toFixed(2) : null
    const consumption = localRatePct ? Math.round(cell.annual_burden / (parseFloat(localRatePct) / 100)) : null
    rows = [
      { label: 'County local add-on rate', value: localRatePct ? `${localRatePct}%` : '2.00% or 2.25%', note: 'NCDOR effective 7/1/2024: either 2.00% or 2.25% depending on county' },
      { label: 'Est. taxable consumption', value: consumption ? formatCurrency(consumption) : '—', note: 'BLS Consumer Expenditure Survey 2024' },
      { label: 'Formula', value: consumption && localRatePct ? `${localRatePct}% × ${formatCurrency(consumption)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr` : '—', mono: true },
    ]
  }

  if (taxKey === 'federal_income_tax') {
    const effPct = (cell.effective_rate * 100).toFixed(1)
    rows = [
      { label: 'Effective rate (this bracket)', value: `${effPct}%`, note: 'National distributional average, identical for all NC counties' },
      { label: 'Source', value: 'ITEP Who Pays Taxes in America 2024; IRS SOI 2022 Table 1.4' },
      { label: 'Formula', value: `${effPct}% × ${formatCurrency(income)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr`, mono: true },
      { label: 'Note', value: 'Does not model itemized deductions, credits, capital gains, EITC, or AMT. Individual liability will differ.' },
    ]
  }

  if (taxKey === 'payroll_tax') {
    const SS_RATE = 6.2
    const SS_WAGE_BASE = 176100
    const MEDICARE_RATE = 1.45
    const ssTaxable = Math.min(income, SS_WAGE_BASE)
    const ss = cell.social_security ?? Math.round(ssTaxable * SS_RATE / 100)
    const med = cell.medicare ?? Math.round(income * MEDICARE_RATE / 100)
    rows = [
      { label: 'Social Security rate', value: `${SS_RATE}% on first ${formatCurrency(SS_WAGE_BASE)} of wages`, note: '2026 SS wage base (SSA COLA announcement Oct 2025)' },
      { label: 'Medicare rate', value: `${MEDICARE_RATE}%` },
      { label: 'SS formula', value: `${SS_RATE}% × ${formatCurrency(ssTaxable)} = ${formatCurrency(ss)}/yr`, mono: true },
      { label: 'Medicare formula', value: `${MEDICARE_RATE}% × ${formatCurrency(income)} = ${formatCurrency(med)}/yr`, mono: true },
      { label: 'Total', value: `${formatCurrency(ss)} + ${formatCurrency(med)} = ${formatCurrency(Math.round(cell.annual_burden))}/yr`, mono: true },
      { label: 'Note', value: PAYROLL_CAVEAT },
    ]
  }

  if (rows.length === 0) return null

  return (
    <tr className="receipt-row">
      <td colSpan={4} className="receipt-cell">
        <div className="receipt-panel">
          <div className="receipt-grid">
            {rows.map((row, i) => (
              <div key={i} className="receipt-item">
                <span className="receipt-label">{row.label}</span>
                <span className={`receipt-value${row.mono ? ' receipt-value--mono' : ''}`}>
                  {row.value}
                  {row.note && <span className="receipt-note"> · {row.note}</span>}
                </span>
              </div>
            ))}
          </div>

          {taxKey === 'state_income_tax' && (
            <div className="receipt-trend">
              <button
                type="button"
                className="trend-link"
                onClick={onToggleTrend}
                aria-expanded={showTrend}
              >
                {showTrend ? 'Hide rate history' : 'See NC rate history (2020–2026) ↗'}
              </button>
              {showTrend && (
                <div className="receipt-trend-chart">
                  <StateTaxTrendChart bracket={bracket} />
                </div>
              )}
            </div>
          )}

          <div className="receipt-footer">
            <SourceLinks taxKey={taxKey} />
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Renter tooltip ────────────────────────────────────────────────────────────

export function RenterTooltip() {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const triggerRef = useRef(null)
  const [position, setPosition] = useState(null)

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      const viewportPadding = 12
      const preferredWidth = 320
      const preferredGap = 12
      const estimatedHeight = 152

      let left = rect.right + preferredGap
      let top = rect.top + rect.height / 2 - estimatedHeight / 2
      let placement = 'right'

      if (left + preferredWidth > window.innerWidth - viewportPadding) {
        left = Math.max(viewportPadding, rect.left - preferredWidth - preferredGap)
        placement = 'left'
      }

      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - estimatedHeight - viewportPadding))

      setPosition({
        left,
        top,
        placement,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    if (open) {
      window.addEventListener('keydown', onKeyDown)
      return () => window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <span className="renter-tooltip">
      <button
        type="button"
        className="renter-tooltip__trigger"
        ref={triggerRef}
        aria-expanded={open}
        aria-controls={tooltipId}
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen(o => !o)}
        aria-label="Why renters bear this cost"
      >
        Why?
      </button>
      {open && position && createPortal(
        <span
          id={tooltipId}
          className={`renter-tooltip__body renter-tooltip__body--${position.placement}`}
          style={{ left: `${position.left}px`, top: `${position.top}px` }}
          role="tooltip"
        >
          {RENTER_TOOLTIP}
        </span>,
        document.body,
      )}
    </span>
  )
}


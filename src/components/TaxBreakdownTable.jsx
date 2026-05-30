/**
 * TaxBreakdownTable.jsx
 * ---------------------
 * V2 updates:
 *  - Payroll tax row (collapsible into SS + Medicare sub-rows)
 *  - "See trend" disclosure link on state income tax row (F3)
 *  - Federal subtotal includes payroll tax
 *  - Employer-share caveat inline
 */

import { useState } from 'react'
import { TAX_ROWS, getTaxQualityFlag, formatCurrency } from '../lib/taxUtils'
import StateTaxTrendChart from './StateTaxTrendChart'

const RENTER_TOOLTIP =
  "Economists generally assume landlords pass property tax costs on to renters through higher rents. In weaker rental markets, landlords may absorb some of this cost, so this estimate may be slightly high."

const PAYROLL_CAVEAT =
  "Employee share only. The employer's matching contribution (6.2% SS + 1.45% Medicare) is not shown — economists believe some portion falls on workers as lower wages, but this is contested and not modeled."

function RenterTooltip() {
  const [open, setOpen] = useState(false)
  return (
    <span className="renter-tooltip">
      <button
        type="button"
        className="renter-tooltip__trigger"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        aria-label="Why renters bear this cost"
      >
        Why?
      </button>
      {open && (
        <span className="renter-tooltip__body" role="tooltip">
          {RENTER_TOOLTIP}
        </span>
      )}
    </span>
  )
}

function PayrollRows({ payrollCell, income }) {
  const [expanded, setExpanded] = useState(false)
  if (!payrollCell) return null

  const ss  = payrollCell.social_security ?? 0
  const med = payrollCell.medicare ?? 0

  return (
    <>
      <tr className="payroll-row">
        <td>
          <button
            type="button"
            className="expand-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? '▾' : '▸'}
          </button>
          {' '}Payroll taxes (employee share)
        </td>
        <td className="num-col">{formatCurrency(payrollCell.annual_burden)}</td>
        <td className="num-col">{((payrollCell.annual_burden / income) * 100).toFixed(1)}%</td>
        <td className="note-col">
          <span className="federal-notice">Employee share only · Federal · County-invariant</span>
        </td>
      </tr>
      {expanded && (
        <>
          <tr className="payroll-subrow">
            <td className="subrow-label">└ Social Security (6.2%)</td>
            <td className="num-col">{formatCurrency(ss)}</td>
            <td className="num-col">{((ss / income) * 100).toFixed(1)}%</td>
            <td className="note-col"></td>
          </tr>
          <tr className="payroll-subrow">
            <td className="subrow-label">└ Medicare (1.45%)</td>
            <td className="num-col">{formatCurrency(med)}</td>
            <td className="num-col">{((med / income) * 100).toFixed(1)}%</td>
            <td className="note-col"></td>
          </tr>
          <tr className="payroll-caveat-row">
            <td colSpan={4} className="payroll-caveat">{PAYROLL_CAVEAT}</td>
          </tr>
        </>
      )}
    </>
  )
}

function SkeletonTable() {
  return (
    <div className="skeleton-table" aria-busy="true" aria-label="Loading tax data">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  )
}

export default function TaxBreakdownTable({
  record,
  housing,
  bracket,
  loading,
  municipalAddition = 0,
  municipalLabel = null,
}) {
  const [showTrend, setShowTrend] = useState(false)

  if (loading) return <SkeletonTable />
  if (!record) return null

  const { taxes, total, data_quality_flags: flags } = record
  const income = total.annual_burden / (total.pct_income / 100)
  const bracketIncome = Math.round(income)

  // V1 rows (exclude payroll — handled separately)
  const v1Rows = TAX_ROWS.filter(r => !r.v2)

  const hasEstimated = v1Rows.some(
    row => getTaxQualityFlag(row.key, flags) === 'ESTIMATED'
  )

  // Total including payroll and any municipal addition
  const payrollBurden = taxes.payroll_tax?.annual_burden ?? 0
  const grandTotal = total.annual_burden + municipalAddition

  return (
    <div className="breakdown-wrap">
      <table className="breakdown-table">
        <caption className="sr-only">Tax burden breakdown by type</caption>
        <thead>
          <tr>
            <th scope="col">Tax Type</th>
            <th scope="col" className="num-col">Amount</th>
            <th scope="col" className="num-col">% of Income</th>
            <th scope="col" className="note-col">Note</th>
          </tr>
        </thead>
        <tbody>
          {v1Rows.map(row => {
            const cell = taxes[row.key]
            if (!cell) return null
            const flag = getTaxQualityFlag(row.key, flags)
            const suppressed = flag === 'SUPPRESSED'
            const estimated  = flag === 'ESTIMATED'
            const isRenterProp = housing === 'renter' && row.key === 'property_tax'
            const isFederal    = row.key === 'federal_income_tax'
            const isStateTax   = row.key === 'state_income_tax'
            const isPropertyTax = row.key === 'property_tax'

            // Municipal property tax row — adjusted label + addition
            const showMunicipalLine = isPropertyTax && municipalAddition > 0 && municipalLabel

            return (
              <>
                <tr key={row.key}>
                  <td>
                    {isRenterProp ? 'Property tax (passed through in rent)' : row.label}
                    {isRenterProp && <RenterTooltip />}
                    {isStateTax && (
                      <button
                        type="button"
                        className="trend-link"
                        onClick={() => setShowTrend(s => !s)}
                        aria-expanded={showTrend}
                      >
                        {showTrend ? 'Hide trend' : 'See trend ↗'}
                      </button>
                    )}
                  </td>
                  <td className="num-col">
                    {suppressed ? (
                      <span className="suppressed" tabIndex={0} title="Data quality insufficient" aria-label="Data suppressed">—</span>
                    ) : (
                      <>
                        {formatCurrency(cell.annual_burden + (showMunicipalLine ? municipalAddition : 0))}
                        {estimated && <sup className="flag-asterisk" aria-label="estimate less reliable">*</sup>}
                      </>
                    )}
                  </td>
                  <td className="num-col">
                    {suppressed ? (
                      <span className="suppressed" aria-hidden="true">—</span>
                    ) : (
                      <>
                        {(((cell.annual_burden + (showMunicipalLine ? municipalAddition : 0)) / bracketIncome) * 100).toFixed(1)}%
                        {estimated && <sup className="flag-asterisk" aria-hidden="true">*</sup>}
                      </>
                    )}
                  </td>
                  <td className="note-col">
                    {isFederal
                      ? <span className="federal-notice">Effective rate estimate; national average</span>
                      : showMunicipalLine
                        ? <span className="muni-notice">
                            Includes {municipalLabel} city rate of ${(taxes.property_tax?.effective_rate * 100 ?? 0).toFixed(3)}/100 + county rate.
                            Source: NC DST AFIR FY2025.
                          </span>
                        : row.note ?? null
                    }
                  </td>
                </tr>
                {isStateTax && showTrend && (
                  <tr key="trend-row">
                    <td colSpan={4} className="trend-row-cell">
                      <StateTaxTrendChart bracket={bracket} currentAmount={cell.annual_burden} />
                    </td>
                  </tr>
                )}
              </>
            )
          })}

          {/* V2: Payroll tax row (collapsible) */}
          <PayrollRows payrollCell={taxes.payroll_tax} income={bracketIncome} />
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td><strong>Total Estimated Burden</strong></td>
            <td className="num-col"><strong>{formatCurrency(grandTotal)}</strong></td>
            <td className="num-col"><strong>{((grandTotal / bracketIncome) * 100).toFixed(1)}%</strong></td>
            <td className="note-col"></td>
          </tr>
        </tfoot>
      </table>

      {hasEstimated && (
        <p className="flag-footnote">
          * Estimate less reliable for this income bracket — see{' '}
          <a href="#methodology">methodology</a> for details.
        </p>
      )}
    </div>
  )
}

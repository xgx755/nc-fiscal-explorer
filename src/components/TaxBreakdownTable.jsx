/**
 * TaxBreakdownTable.jsx
 * ---------------------
 * V3 updates:
 *  - Inline receipt expansion on every row (Plan A — "How?" toggle)
 *  - Trend chart moved into the state income tax receipt panel
 *  - PolicySimulation removed
 */

import { Fragment, useState } from 'react'
import { TAX_ROWS, getTaxQualityFlag, formatCurrency, BRACKET_INCOMES } from '../lib/taxUtils'
import { InlineReceipt, RenterTooltip, PAYROLL_CAVEAT } from './receipts'

// ── Payroll rows ──────────────────────────────────────────────────────────────

function PayrollRows({ payrollCell, income, expanded, onToggle, receiptOpen, onReceiptToggle, bracket }) {
  if (!payrollCell) return null
  const ss  = payrollCell.social_security ?? 0
  const med = payrollCell.medicare ?? 0
  return (
    <>
      <tr id="tax-row-payroll_tax" className={`payroll-row${receiptOpen ? ' tax-row--open' : ''}`}>
        <td>
          <button type="button" className="expand-toggle" aria-expanded={expanded} onClick={onToggle}>
            {expanded ? '▾' : '▸'}
          </button>
          {' '}Payroll taxes (employee share)
          <button
            type="button"
            className="receipt-toggle"
            aria-expanded={receiptOpen}
            onClick={onReceiptToggle}
            aria-label={`${receiptOpen ? 'Hide' : 'Show'} payroll tax calculation`}
          >
            {receiptOpen ? '▲ Hide' : '▼ How?'}
          </button>
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
      {receiptOpen && (
        <InlineReceipt
          taxKey="payroll_tax"
          cell={payrollCell}
          income={income}
          bracket={bracket}
        />
      )}
    </>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonTable() {
  return (
    <div className="skeleton-table" aria-busy="true" aria-label="Loading tax data">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function TaxBreakdownTable({
  record,
  housing,
  bracket,
  loading,
  municipalAddition = 0,
  municipalLabel = null,
  expandedReceipt: controlledExpandedReceipt,
  onExpandedReceiptChange,
}) {
  const [internalExpandedReceipt, setInternalExpandedReceipt] = useState(null)
  const [payrollExpanded, setPayrollExpanded] = useState(false)
  const [showTrend, setShowTrend] = useState(false)

  const isControlled = controlledExpandedReceipt !== undefined
  const expandedReceipt = isControlled ? controlledExpandedReceipt : internalExpandedReceipt
  const setExpandedReceipt = isControlled
    ? (updater) => onExpandedReceiptChange?.(
        typeof updater === 'function' ? updater(controlledExpandedReceipt) : updater
      )
    : setInternalExpandedReceipt

  function toggleReceipt(key) {
    setExpandedReceipt(prev => {
      if (prev === key) return null
      if (prev === 'state_income_tax') setShowTrend(false)
      return key
    })
  }

  if (loading) return <SkeletonTable />
  if (!record) return null

  const { taxes, total, data_quality_flags: flags } = record
  const bracketIncome = BRACKET_INCOMES[bracket] ?? Math.round(total.annual_burden / (total.pct_income / 100))

  const v1Rows = TAX_ROWS.filter(r => !r.v2)
  const hasEstimated = v1Rows.some(row => getTaxQualityFlag(row.key, flags) === 'ESTIMATED')
  const grandTotal = total.annual_burden + municipalAddition

  return (
    <div className="breakdown-wrap">
      <table className="breakdown-table">
        <caption className="sr-only">Tax burden breakdown by type</caption>
        <thead>
          <tr>
            <th scope="col">Tax type</th>
            <th scope="col" className="num-col">Amount</th>
            <th scope="col" className="num-col">% of income</th>
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
            const isRenterProp  = housing === 'renter' && row.key === 'property_tax'
            const isFederal     = row.key === 'federal_income_tax'
            const isPropertyTax = row.key === 'property_tax'
            const isStateTax    = row.key === 'state_income_tax'
            const showMunicipalLine = isPropertyTax && municipalAddition > 0 && municipalLabel
            const isOpen = expandedReceipt === row.key

            return (
              <Fragment key={row.key}>
                <tr id={`tax-row-${row.key}`} className={`tax-row${isOpen ? ' tax-row--open' : ''}`}>
                  <td>
                    {isRenterProp ? 'Property tax (passed through in rent)' : row.label}
                    {isRenterProp && <RenterTooltip />}
                    {!suppressed && (
                      <button
                        type="button"
                        className="receipt-toggle"
                        aria-expanded={isOpen}
                        onClick={() => toggleReceipt(row.key)}
                        aria-label={`${isOpen ? 'Hide' : 'Show'} ${row.label} calculation`}
                      >
                        {isOpen ? '▲ Hide' : '▼ How?'}
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
                    {isFederal && (
                      <span className="federal-notice">Effective rate · national average</span>
                    )}
                    {showMunicipalLine && (
                      <span className="muni-notice">
                        County + {municipalLabel} city rate. Source: NC DST AFIR FY2025.
                      </span>
                    )}
                  </td>
                </tr>
                {isOpen && (
                  <InlineReceipt
                    taxKey={row.key}
                    cell={cell}
                    income={bracketIncome}
                    housing={housing}
                    bracket={bracket}
                    showTrend={isStateTax && showTrend}
                    onToggleTrend={() => setShowTrend(s => !s)}
                  />
                )}
              </Fragment>
            )
          })}

          <PayrollRows
            payrollCell={taxes.payroll_tax}
            income={bracketIncome}
            expanded={payrollExpanded}
            onToggle={() => setPayrollExpanded(e => !e)}
            receiptOpen={expandedReceipt === 'payroll_tax'}
            onReceiptToggle={() => toggleReceipt('payroll_tax')}
            bracket={bracket}
          />
        </tbody>
        <tfoot>
          <tr className="total-row">
            <td><strong>Total estimated burden</strong></td>
            <td className="num-col"><strong>{formatCurrency(grandTotal)}</strong></td>
            <td className="num-col"><strong>{((grandTotal / bracketIncome) * 100).toFixed(1)}%</strong></td>
            <td className="note-col"></td>
          </tr>
        </tfoot>
      </table>

      {hasEstimated && (
        <p className="flag-footnote">
          * Estimate less reliable for this income bracket. See{' '}
          <a href="#methodology">methodology</a> for details.
        </p>
      )}
    </div>
  )
}

import { Fragment } from 'react'
import { TAX_ROWS, getTaxQualityFlag, formatCurrency } from '../lib/taxUtils'

const FEDERAL_NOTICE = 'Estimated from national averages — does not vary by county.'

const INTERPRETIVE = {
  property_tax:
    'Property tax burden varies because home values differ by income bracket — higher-income households own more valuable homes, but the rate applies to assessed value, not income.',
  sales_tax_state:
    'Sales tax takes a larger share of income for lower-earning households because they spend a higher fraction of their income on taxable goods — economists call this regressivity.',
  state_income_tax:
    "NC's flat rate means similar effective rates across income levels, but the standard deduction provides some relief at lower incomes.",
}

function CellValue({ cell, flags, taxKey }) {
  if (!cell) return <td className="num-col">—</td>
  const flag = getTaxQualityFlag(taxKey, flags)
  const suppressed = flag === 'SUPPRESSED'
  const estimated = flag === 'ESTIMATED'
  return (
    <>
      <td className="num-col">
        {suppressed ? (
          <span className="suppressed" title="Data quality insufficient">—</span>
        ) : (
          <>
            {formatCurrency(cell.annual_burden)}
            {estimated && <sup className="flag-asterisk" aria-label="estimate less reliable">*</sup>}
          </>
        )}
      </td>
      <td className="num-col">
        {suppressed ? (
          <span className="suppressed" aria-hidden="true">—</span>
        ) : (
          <>
            {cell.pct_income.toFixed(1)}%
            {estimated && <sup className="flag-asterisk" aria-hidden="true">*</sup>}
          </>
        )}
      </td>
    </>
  )
}

export default function BracketCompareTable({ record1, record2, bracket1, bracket2, housing }) {
  if (!record1 || !record2) return null
  if (bracket1 === bracket2) {
    return (
      <p className="compare-same-hint">
        Select a different bracket to compare.
      </p>
    )
  }

  const flags1 = record1.data_quality_flags
  const flags2 = record2.data_quality_flags
  const hasEstimated =
    TAX_ROWS.some(r => getTaxQualityFlag(r.key, flags1) === 'ESTIMATED') ||
    TAX_ROWS.some(r => getTaxQualityFlag(r.key, flags2) === 'ESTIMATED')

  return (
    <div className="compare-wrap">
      <h3 className="compare-title">Bracket Comparison — {housing === 'owner' ? 'Homeowner' : 'Renter'}</h3>
      <div className="compare-table-scroll">
        <table className="compare-table">
          <caption className="sr-only">Side-by-side tax burden comparison by income bracket</caption>
          <thead>
            <tr>
              <th scope="col" rowSpan={2}>Tax</th>
              <th scope="col" rowSpan={2}>Level</th>
              <th scope="colgroup" colSpan={2} className="bracket-col-header">{bracket1}</th>
              <th scope="colgroup" colSpan={2} className="bracket-col-header bracket-col-header--compare">{bracket2}</th>
            </tr>
            <tr>
              <th scope="col" className="num-col sub-header">Burden</th>
              <th scope="col" className="num-col sub-header">% Income</th>
              <th scope="col" className="num-col sub-header bracket-col--compare">Burden</th>
              <th scope="col" className="num-col sub-header bracket-col--compare">% Income</th>
            </tr>
          </thead>
          <tbody>
            {TAX_ROWS.map(row => {
              const cell1 = record1.taxes[row.key]
              const cell2 = record2.taxes[row.key]
              const note = INTERPRETIVE[row.key]
              return (
                <Fragment key={row.key}>
                  <tr>
                    <td>
                      {housing === 'renter' && row.key === 'property_tax'
                        ? 'Property tax (passed through in rent)'
                        : row.label}
                      {row.key === 'federal_income_tax' && (
                        <span className="federal-notice"> {FEDERAL_NOTICE}</span>
                      )}
                    </td>
                    <td>
                      <span className={`level-badge level-badge--${row.level.toLowerCase()}`}>
                        {row.level}
                      </span>
                    </td>
                    <CellValue cell={cell1} flags={flags1} taxKey={row.key} />
                    <CellValue cell={cell2} flags={flags2} taxKey={row.key} />
                  </tr>
                  {note && (
                    <tr className="interpretive-row">
                      <td colSpan={6} className="interpretive-note">{note}</td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={2}><strong>Total</strong></td>
              <td className="num-col"><strong>{formatCurrency(record1.total.annual_burden)}</strong></td>
              <td className="num-col"><strong>{record1.total.pct_income.toFixed(1)}%</strong></td>
              <td className="num-col bracket-col--compare"><strong>{formatCurrency(record2.total.annual_burden)}</strong></td>
              <td className="num-col bracket-col--compare"><strong>{record2.total.pct_income.toFixed(1)}%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
      {hasEstimated && (
        <p className="flag-footnote">
          * Estimate less reliable for this income bracket — see{' '}
          <a href="#methodology">methodology</a> for details.
        </p>
      )}
    </div>
  )
}

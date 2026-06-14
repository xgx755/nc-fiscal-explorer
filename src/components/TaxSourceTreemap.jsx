/**
 * TaxSourceTreemap.jsx
 * ---------------------
 * "Where your taxes come from" treemap + breakdown for the Revenue page.
 *
 * Parallels TaxToServices.jsx's "Where your taxes go" purpose treemap, but
 * for the revenue side: cells are sized by the dollar amount of each tax
 * type the household pays, and colored by which level of government
 * collects it (Local / State / Federal), using the same LEVEL_COLORS as
 * TaxStackedBar and the level legend on the Expenditures page.
 *
 * Below the treemap, each tax source is listed as an expandable row
 * (styled like the Expenditures page's purpose breakdown):
 *  - the colored bar reflects the tax's share of the total tax burden
 *  - the % figure reflects the tax's share of household income
 *  - expanding a row shows the same "How?" receipt detail that used to
 *    live in TaxBreakdownTable.
 *
 * Payroll tax is split into Social Security and Medicare rows/cells; both
 * expand to show the same combined payroll_tax receipt.
 */

import { useRef, useState } from 'react'
import { Treemap, ResponsiveContainer } from 'recharts'
import { TAX_ROWS, LEVEL_COLORS, getTaxQualityFlag, formatCurrency } from '../lib/taxUtils'
import { TreemapCell } from './treemap/TreemapCell'
import { InlineReceipt, RenterTooltip } from './receipts'

function levelShare(amount, total) {
  return total > 0 ? (amount / total) * 100 : 0
}

// Per-tax color variants — small shifts on each level's base color
// (LEVEL_COLORS) so individual taxes are distinguishable from one another
// while still reading as "the same level" at a glance.
const TAX_COLORS = {
  property_tax:         '#2d6a30', // Local — base green
  sales_tax_local:      '#4f9153', // Local — lighter green
  sales_tax_state:      '#c05600', // State — base amber
  state_income_tax:     '#e08a33', // State — lighter amber
  federal_income_tax:   '#1a4480', // Federal — base navy
  payroll_tax_ss:       '#3a6ba8', // Federal — mid blue
  payroll_tax_medicare: '#6a93c2', // Federal — light blue
}

function taxColor(key, level) {
  return TAX_COLORS[key] ?? LEVEL_COLORS[level]
}

/**
 * Builds treemap cells from a tax record. Payroll tax is split into its
 * Social Security and Medicare components (both still map back to the
 * `payroll_tax` row for the shared "How?" receipt), matching the level of
 * detail already shown in TaxBreakdownTable's payroll sub-rows.
 */
function buildCells(record, municipalAddition, housing) {
  const { taxes, data_quality_flags: flags = [] } = record
  const cells = []

  for (const row of TAX_ROWS) {
    const cell = taxes[row.key]
    if (!cell) continue

    if (row.key === 'payroll_tax') {
      const ss = cell.social_security ?? 0
      const med = cell.medicare ?? 0
      if (ss > 0) {
        cells.push({ key: 'payroll_tax_ss', taxRowKey: 'payroll_tax', name: 'Social Security', size: ss, level: row.level, estimated: false })
      }
      if (med > 0) {
        cells.push({ key: 'payroll_tax_medicare', taxRowKey: 'payroll_tax', name: 'Medicare', size: med, level: row.level, estimated: false })
      }
      continue
    }

    let amount = cell.annual_burden ?? 0
    if (row.key === 'property_tax') amount += municipalAddition

    let name = row.label
    let renter = false
    if (row.key === 'property_tax' && housing === 'renter') {
      name = 'Property tax (passed through in rent)'
      renter = true
    }

    if (amount > 0) {
      const estimated = getTaxQualityFlag(row.key, flags) === 'ESTIMATED'
      cells.push({ key: row.key, taxRowKey: row.key, name, size: amount, level: row.level, estimated, renter })
    }
  }

  return cells
}

export default function TaxSourceTreemap({ record, municipalAddition = 0, housing, bracket, bracketIncome }) {
  const [expandedKey, setExpandedKey] = useState(null)
  const [showTrend, setShowTrend] = useState(false)
  const rowRefs = useRef({})

  if (!record) return null

  const cells = buildCells(record, municipalAddition, housing)
  if (cells.length === 0) return null

  const grandTotal = cells.reduce((sum, c) => sum + c.size, 0)
  const income = bracketIncome > 0 ? bracketIncome : grandTotal

  const sortedCells = [...cells].sort((a, b) => b.size - a.size)

  const treemapData = sortedCells.map(c => ({
    key: c.key,
    itemKey: c.taxRowKey,
    name: c.name,
    size: c.size,
    pct: levelShare(c.size, grandTotal),
    incomePct: levelShare(c.size, income),
    color: taxColor(c.key, c.level),
    level: c.level,
    estimated: c.estimated,
    renter: c.renter,
  }))

  const hasEstimated = treemapData.some(c => c.estimated)

  const toggleExpand = (key) => {
    setExpandedKey(prev => {
      if (prev === key) return null
      if (prev === 'state_income_tax') setShowTrend(false)
      return key
    })
  }

  const handleSelectFromTreemap = (itemKey) => {
    // Treemap cells use itemKey (taxRowKey); map back to the first matching
    // row's cell key so we expand/scroll the right row.
    const match = treemapData.find(c => c.itemKey === itemKey) ?? treemapData.find(c => c.key === itemKey)
    if (!match) return
    toggleExpand(match.key)
    rowRefs.current[match.key]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <section className="trs-section" aria-labelledby="trs-heading">
      <div className="trs-header">
        <div>
          <h2 className="section-heading" id="trs-heading">
            Where your taxes go
          </h2>
          <p className="trs-subtitle">
            Each tile is one tax you pay, sized by its share of your total estimated burden and
            colored by which level of government collects it. Select a tile or row to see how
            it's calculated.
          </p>
        </div>

        <div className="trs-legend" aria-hidden="true">
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <span key={level} className="trs-legend__item">
              <span className="trs-legend__swatch" style={{ background: color }} />
              {level}
            </span>
          ))}
        </div>
      </div>

      <div className="tts-breakdown">
        <div className="trs-treemap" role="img" aria-label="Tax burden by source, sized by share of total tax burden">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={treemapData}
              dataKey="size"
              nameKey="name"
              stroke="transparent"
              isAnimationActive={false}
              content={<TreemapCell onSelect={handleSelectFromTreemap} />}
            />
          </ResponsiveContainer>
        </div>

        <div className="tts-purpose-rows" role="list" aria-label="Tax burden by source">
          {treemapData.map(c => {
            const isOpen = expandedKey === c.key
            const cell = record.taxes[c.itemKey]

            return (
              <div
                key={c.key}
                ref={el => { rowRefs.current[c.key] = el }}
                className={`tts-purpose-row${isOpen ? ' tts-purpose-row--active' : ''}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="tts-purpose-row__main"
                  onClick={() => toggleExpand(c.key)}
                  aria-expanded={isOpen}
                >
                  <span className="tts-purpose-row__swatch" style={{ background: c.color }} aria-hidden="true" />

                  <span className="tts-purpose-row__label">
                    {c.name}
                    {c.renter && <RenterTooltip />}
                  </span>

                  <span className="tts-purpose-row__bar" aria-hidden="true">
                    <span className="tts-purpose-row__segment" style={{ width: `${Math.max(c.pct, 2)}%`, background: c.color }} />
                  </span>

                  <span className="tts-purpose-row__pct">
                    {c.incomePct.toFixed(1)}%
                    {c.estimated && <sup className="flag-asterisk" aria-hidden="true">*</sup>}
                  </span>
                  <span className="tts-purpose-row__amount">
                    {formatCurrency(c.size)}
                    {c.estimated && <sup className="flag-asterisk" aria-label="estimate less reliable">*</sup>}
                  </span>
                  <span
                    className={`tts-purpose-row__chevron${isOpen ? ' tts-purpose-row__chevron--open' : ''}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {isOpen && (
                  <div className="tts-purpose-row__detail tts-purpose-row__detail--enter">
                    <InlineReceipt
                      taxKey={c.itemKey}
                      cell={cell}
                      income={income}
                      housing={housing}
                      bracket={bracket}
                      showTrend={c.itemKey === 'state_income_tax' && showTrend}
                      onToggleTrend={() => setShowTrend(s => !s)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="trs-total-row" role="listitem" aria-label="Total estimated tax burden">
          <span className="trs-total-row__label">Total estimated burden</span>
          <span className="trs-total-row__pct">{((grandTotal / income) * 100).toFixed(1)}%</span>
          <span className="trs-total-row__amount">{formatCurrency(grandTotal)}</span>
        </div>

        {hasEstimated && (
          <p className="flag-footnote">
            * Estimate less reliable for this income bracket. See{' '}
            <a href="#methodology">methodology</a> for details.
          </p>
        )}
      </div>

      <table className="sr-only" aria-label="Tax burden by source table">
        <thead>
          <tr>
            <th>Tax</th>
            <th>Level</th>
            <th>Amount</th>
            <th>% of income</th>
            <th>% of total burden</th>
          </tr>
        </thead>
        <tbody>
          {treemapData.map(c => (
            <tr key={c.key}>
              <td>{c.name}</td>
              <td>{c.level}</td>
              <td>{formatCurrency(c.size)}</td>
              <td>{c.incomePct.toFixed(1)}%</td>
              <td>{c.pct.toFixed(0)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

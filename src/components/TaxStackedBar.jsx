import { formatCurrency } from '../lib/taxUtils'

// V2: federalSegment now includes payroll tax; accepts municipalAddition for F5
export default function TaxStackedBar({ record, municipalAddition = 0 }) {
  if (!record) return null

  const { taxes } = record
  // V2: federal includes payroll tax
  const federal = (taxes.federal_income_tax?.annual_burden ?? 0) +
                  (taxes.payroll_tax?.annual_burden ?? 0)
  const stateAmount = (taxes.state_income_tax?.annual_burden ?? 0) +
                      (taxes.sales_tax_state?.annual_burden ?? 0)
  const property = (taxes.property_tax?.annual_burden ?? 0) + municipalAddition
  const sales    = taxes.sales_tax_local?.annual_burden ?? 0

  const segments = [
    { key: 'federal',  label: 'Federal (income + payroll)', value: federal,      color: 'var(--chart-federal)' },
    { key: 'state',    label: 'State (income + sales)',     value: stateAmount,  color: 'var(--chart-state)' },
    { key: 'property', label: 'Property tax',               value: property,     color: 'var(--chart-property)' },
    { key: 'sales',    label: 'Local sales tax',            value: sales,        color: 'var(--chart-sales)' },
  ].filter(s => s.value > 0)

  const total = segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div>
      <div
        className="stacked-bar"
        role="img"
        aria-label={segments.map(s => `${s.label}: ${Math.round(s.value / total * 100)}%`).join(', ')}
      >
        {segments.map((s, i) => (
          <div
            key={s.key}
            className="stacked-bar__segment"
            style={{
              flexBasis: `${(s.value / total * 100).toFixed(2)}%`,
              background: s.color,
              marginLeft: i === 0 ? 0 : '2px',
            }}
            title={`${s.label}: ${formatCurrency(s.value)} (${Math.round(s.value / total * 100)}%)`}
          />
        ))}
      </div>

      <div className="stacked-bar__legend">
        {segments.map(s => (
          <span key={s.key} className="legend-item">
            <span className="legend-swatch" style={{ background: s.color }} />
            <span className="legend-text">
              <span className="legend-label">{s.label}</span>
              <span className="legend-detail">
                {formatCurrency(s.value)}
                <span className="legend-pct"> · {Math.round(s.value / total * 100)}%</span>
              </span>
            </span>
          </span>
        ))}
      </div>

      <p className="chart-source">
        Source: Calculated from 2023–2026 IRS, NCDOR, and SSA data. Federal segment includes employee payroll taxes (V2).
      </p>
    </div>
  )
}

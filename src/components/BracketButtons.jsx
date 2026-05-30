import { BRACKETS } from '../lib/taxUtils'

export default function BracketButtons({ value, onChange }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
      <legend className="sr-only">Household income bracket</legend>
      <div className="bracket-buttons" role="group" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {BRACKETS.map(b => (
          <button
            key={b.key}
            type="button"
            className={`pill-btn${value === b.key ? ' pill-btn--active' : ''}`}
            onClick={() => onChange(b.key)}
            aria-pressed={value === b.key}
            aria-label={`${b.label} — ${b.sublabel}`}
          >
            {b.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

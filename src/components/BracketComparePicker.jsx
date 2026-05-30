import { BRACKETS } from '../lib/taxUtils'

export default function BracketComparePicker({ value, primary, onChange }) {
  return (
    <div className="compare-picker">
      <span className="compare-picker__label">Compare with:</span>
      <div className="compare-bracket-buttons" role="group" aria-label="Comparison income bracket">
        {BRACKETS.map(b => {
          const isActive = value === b.key
          const isPrimary = b.key === primary
          return (
            <button
              key={b.key}
              type="button"
              className={[
                'pill-btn pill-btn--sm',
                isActive ? 'pill-btn--active' : '',
                isPrimary ? 'pill-btn--dim' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => onChange(isActive ? null : b.key)}
              aria-pressed={isActive}
              aria-label={`Compare with ${b.label}${isPrimary ? ' (current bracket)' : ''}`}
            >
              {b.label}
            </button>
          )
        })}
        {value && (
          <button
            type="button"
            className="compare-clear-btn"
            onClick={() => onChange(null)}
            aria-label="Clear comparison"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

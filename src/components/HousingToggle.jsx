export default function HousingToggle({ value, onChange }) {
  return (
    <div className="pill-toggle" role="group" aria-label="Housing status">
      {[['owner', 'Homeowner'], ['renter', 'Renter']].map(([key, label]) => (
        <button
          key={key}
          type="button"
          className={`pill-toggle__btn${value === key ? ' pill-toggle__btn--active' : ''}`}
          onClick={() => onChange(key)}
          aria-pressed={value === key}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

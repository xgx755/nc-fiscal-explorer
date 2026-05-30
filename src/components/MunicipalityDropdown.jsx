/**
 * MunicipalityDropdown.jsx
 * ------------------------
 * Feature 5: County-filtered municipality selector.
 * Defaults to "Unincorporated (county rate only)" — same as V1 baseline.
 * Resets to unincorporated when county changes.
 */

export const UNINCORPORATED = '__unincorporated__'

export default function MunicipalityDropdown({ county, municipalRates, value, onChange }) {
  const options = municipalRates?.[county] ?? []

  return (
    <div className="muni-dropdown-wrap">
      <label htmlFor="muni-select" className="sr-only">Municipality</label>
      <select
        id="muni-select"
        className="pill-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label="Select municipality (optional)"
      >
        <option value={UNINCORPORATED}>Unincorporated / no city tax</option>
        {options.length > 0 && <option disabled>──────────────</option>}
        {options.map(m => (
          <option key={m.name} value={m.name}>
            {m.name} (${m.rate.toFixed(3)}/100)
          </option>
        ))}
        {options.length === 0 && (
          <option disabled>No municipalities on file for this county</option>
        )}
      </select>
    </div>
  )
}

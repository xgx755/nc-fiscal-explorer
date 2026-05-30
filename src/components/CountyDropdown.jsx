export default function CountyDropdown({ counties, value, onChange }) {
  return (
    <>
      <label htmlFor="county-select" className="sr-only">County</label>
      <select
        id="county-select"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="pill-select"
      >
        {counties.map(c => (
          <option key={c} value={c}>{c} County</option>
        ))}
      </select>
    </>
  )
}

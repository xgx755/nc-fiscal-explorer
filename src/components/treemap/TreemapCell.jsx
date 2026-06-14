/**
 * TreemapCell.jsx
 * ----------------
 * Shared recharts <Treemap> cell renderer + label-truncation helper.
 *
 * Originally part of TaxToServices.jsx (the "Where your taxes go" purpose
 * treemap on the Expenditures page). Extracted so it can be reused by the
 * "Where your taxes come from" tax-source treemap on the Revenue page.
 *
 * Renders a label + percentage when the tile is big enough, otherwise falls
 * back to a bare rounded swatch so small cells don't overflow.
 */

// Roughly truncates a label so it fits within a cell of the given width,
// avoiding overflow into neighboring tiles.
export function truncateLabel(name, width) {
  const maxChars = Math.max(0, Math.floor((width - 16) / 6.5))
  if (name.length <= maxChars) return name
  if (maxChars <= 1) return ''
  return `${name.slice(0, maxChars - 1)}…`
}

export function TreemapCell({ x, y, width, height, name, pct, color, itemKey, onSelect }) {
  if (!(width > 0) || !(height > 0) || !color) return null

  const showLabel = width > 56 && height > 32
  const showPct = showLabel && height > 52 && typeof pct === 'number'
  const textColor = '#fff'
  const gap = 2

  const cx = x + width / 2
  const cy = y + height / 2

  return (
    <g
      className="treemap-cell"
      style={{ transformOrigin: `${cx}px ${cy}px`, cursor: onSelect ? 'pointer' : 'default' }}
      onClick={onSelect ? () => onSelect(itemKey) : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `Show detail for ${name}` : undefined}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(itemKey) } } : undefined}
    >
      <rect
        x={x + gap / 2}
        y={y + gap / 2}
        width={Math.max(width - gap, 0)}
        height={Math.max(height - gap, 0)}
        rx={6}
        ry={6}
        className="treemap-cell__rect"
        style={{ fill: color }}
      />
      {showLabel && (
        <text
          x={x + 12}
          y={y + 22}
          fontFamily="var(--font-sans)"
          fontSize={12.5}
          fontWeight={600}
          letterSpacing="0.01em"
          fill={textColor}
        >
          {truncateLabel(name, width)}
        </text>
      )}
      {showPct && (
        <text
          x={x + 12}
          y={y + 41}
          fontFamily="var(--font-sans)"
          fontSize={12}
          fontWeight={400}
          letterSpacing="0.01em"
          fill={textColor}
          opacity={0.8}
        >
          {pct.toFixed(0)}% of total
        </text>
      )}
    </g>
  )
}

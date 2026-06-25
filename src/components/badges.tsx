import type { Category, Status } from '../types'
import { getCategoryColor } from '../lib/categoryColor'

/** Color-coded category pill. Color is always paired with the text label. */
export function CategoryBadge({ category, dot = true }: { category: Category; dot?: boolean }) {
  const color = getCategoryColor(category)
  return (
    <span
      className="pill"
      style={{
        color,
        background: color + '1f', // ~12% alpha
        border: `1px solid ${color}55`,
      }}
    >
      {dot && (
        <span
          aria-hidden
          style={{ width: 7, height: 7, borderRadius: 999, background: color, flex: '0 0 auto' }}
        />
      )}
      {category}
    </span>
  )
}

const STATUS_STYLE: Record<Status, { fg: string; bg: string }> = {
  Cataloged: { fg: 'var(--success)', bg: 'rgba(31,122,68,0.10)' },
  'Needs review': { fg: 'var(--warn)', bg: 'var(--warn-tint)' },
  Misplaced: { fg: 'var(--danger)', bg: 'var(--danger-tint)' },
  'Duplicate possible': { fg: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
}

/** Status indicator. Cataloged is the calm default; others draw attention. */
export function StatusPill({ status }: { status: Status }) {
  if (status === 'Cataloged') return null
  const s = STATUS_STYLE[status]
  return (
    <span className="pill" style={{ color: s.fg, background: s.bg }}>
      ⚠ {status}
    </span>
  )
}

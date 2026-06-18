import type { ReactNode } from 'react'

export function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="chipgroup">{children}</div>
}

export function Chip({
  selected,
  onClick,
  color,
  children,
}: {
  selected: boolean
  onClick: () => void
  /** Optional accent (used by category chips). */
  color?: string
  children: ReactNode
}) {
  const accent = color ?? 'var(--primary)'
  return (
    <button
      type="button"
      className={'chip' + (selected ? ' chip--on' : '')}
      onClick={onClick}
      aria-pressed={selected}
      style={
        selected
          ? { color: '#fff', background: accent, borderColor: accent }
          : { borderColor: color ? color + '66' : 'var(--border-strong)', color: color ?? 'var(--ink-soft)' }
      }
    >
      {children}
    </button>
  )
}

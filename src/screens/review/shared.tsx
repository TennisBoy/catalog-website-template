import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

export function SelectAll({
  allSelected,
  someSelected,
  onToggle,
}: {
  allSelected: boolean
  someSelected: boolean
  onToggle: () => void
}) {
  return (
    <label className="rev-selectall">
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = someSelected && !allSelected
        }}
        onChange={onToggle}
      />
      <span>Select all</span>
    </label>
  )
}

export function RowCheck({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input type="checkbox" className="rev-check" checked={checked} onChange={onChange} aria-label={label} />
  )
}

/** Collapsible group shell. Default-open when it holds anything. */
export function ReviewGroup({
  title,
  hint,
  count,
  tone,
  children,
}: {
  title: string
  hint: string
  count: number
  tone: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(count > 0)
  return (
    <section className="rev-group card" style={{ '--rev-tone': tone } as CSSProperties}>
      <button
        type="button"
        className="rev-group__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="rev-group__chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className="rev-group__title">{title}</span>
        <span className="rev-group__count">{count}</span>
      </button>
      {open && (
        <div className="rev-group__body">
          <p className="rev-group__hint muted">{hint}</p>
          {children}
        </div>
      )}
    </section>
  )
}

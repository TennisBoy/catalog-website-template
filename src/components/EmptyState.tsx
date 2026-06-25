import { Link } from 'react-router-dom'

export function EmptyState({
  icon = '📚',
  title,
  hint,
  actionLabel,
  actionTo,
  onAction,
}: {
  icon?: string
  title: string
  hint?: string
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
}) {
  return (
    <div className="empty card">
      <div className="empty__icon" aria-hidden>
        {icon}
      </div>
      <p className="empty__title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {actionLabel && onAction ? (
        <button type="button" className="btn btn--primary" style={{ marginTop: 'var(--s3)' }} onClick={onAction}>
          {actionLabel}
        </button>
      ) : actionLabel && actionTo ? (
        <Link to={actionTo} className="btn btn--primary" style={{ marginTop: 'var(--s3)' }}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

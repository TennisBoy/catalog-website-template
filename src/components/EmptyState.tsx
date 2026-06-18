import { Link } from 'react-router-dom'

export function EmptyState({
  icon = '📚',
  title,
  hint,
  actionLabel,
  actionTo,
}: {
  icon?: string
  title: string
  hint?: string
  actionLabel?: string
  actionTo?: string
}) {
  return (
    <div className="empty card">
      <div className="empty__icon" aria-hidden>
        {icon}
      </div>
      <p className="empty__title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--primary" style={{ marginTop: 'var(--s3)' }}>
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

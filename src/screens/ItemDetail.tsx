import { Link, useParams } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import { CategoryBadge, StatusPill } from '../components/badges'
import { relativeTime } from '../lib/format'
import './ItemDetail.css'

/** Read-only detail view for the public site (replaces the edit form). */
export function ItemDetail() {
  const { id } = useParams<{ id: string }>()
  const { getItem } = useCatalog()
  const item = id ? getItem(id) : undefined

  if (!item) {
    return (
      <div className="page">
        <p className="muted">That item couldn’t be found.</p>
        <Link to="/catalog" className="btn">
          ‹ Back to catalog
        </Link>
      </div>
    )
  }

  const loc = [item.location.section, item.location.shelf && `Shelf ${item.location.shelf}`]
    .filter(Boolean)
    .join(' · ')

  const rows: [string, string | undefined][] = [
    ['Author', item.author],
    ['ISBN', item.isbn],
    ['Condition', item.condition],
    ['Notes', item.notes],
  ]

  return (
    <div className="page det">
      <Link to="/catalog" className="det__back">
        ‹ Back to catalog
      </Link>

      <header className="det__head">
        <h1>{item.title}</h1>
        <div className="det__tags">
          <CategoryBadge category={item.category} />
          <StatusPill status={item.status} />
        </div>
      </header>

      <div className="card det__card">
        <div className="det__big">
          <div>
            <span className="det__num">{item.quantity.toLocaleString()}</span>
            <span className="det__num-label">copies</span>
          </div>
          <div className="det__loc">
            <span className="eyebrow">Location</span>
            <span className="det__loc-val">{loc || 'No shelf assigned'}</span>
          </div>
        </div>

        <dl className="det__grid">
          <div>
            <dt>Material type</dt>
            <dd>{item.materialType}</dd>
          </div>
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className={k === 'Notes' ? 'det__wide' : ''}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>

        <p className="det__updated muted">Last updated {relativeTime(item.updatedAt)}</p>
      </div>
    </div>
  )
}

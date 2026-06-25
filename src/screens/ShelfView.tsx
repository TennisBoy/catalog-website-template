import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import { shelvesByRoom, type RoomShelfBucket } from '../store/selectors'
import { getCategoryColor } from '../lib/categoryColor'
import { CategoryBadge, StatusPill } from '../components/badges'
import { EmptyState } from '../components/EmptyState'
import { useAddPanel } from '../components/addPanelContext'
import './ShelfView.css'

export function ShelfView() {
  const { items, readOnly } = useCatalog()
  const openAdd = useAddPanel()
  const { rooms, unshelved } = shelvesByRoom(items)
  const [selected, setSelected] = useState<RoomShelfBucket | null>(null)

  if (items.length === 0) {
    return (
      <div className="page">
        <header className="page__head">
          <p className="eyebrow">English Department</p>
          <h1>Shelf View</h1>
        </header>
        <EmptyState
          icon="🗄️"
          title="No shelves to map yet"
          hint="Add items with a shelf location and they'll appear here as a map of the room."
          actionLabel={readOnly ? undefined : 'Add the first item'}
          onAction={readOnly ? undefined : openAdd}
        />
      </div>
    )
  }

  // ---- Shelf detail (replaces the grid) ----
  if (selected) {
    const titles = selected.items.length
    return (
      <div className="page">
        <header className="page__head">
          <button
            type="button"
            className="btn btn--ghost shelf-back"
            onClick={() => setSelected(null)}
          >
            ‹ Back to shelves
          </button>
          <h1 className="shelf-detail-title">
            {selected.section} · {selected.category} · Shelf {selected.shelf}
          </h1>
          <p className="muted">
            {titles} {titles === 1 ? 'title' : 'titles'} · {selected.copies}{' '}
            {selected.copies === 1 ? 'copy' : 'copies'}
          </p>
          <Link to="/labels" className="btn shelf-label-btn">
            🏷 Print this shelf's label
          </Link>
        </header>

        <ul className="shelf-titles card">
          {selected.items.map((it) => (
            <li key={it.id}>
              <Link to={`/item/${it.id}`} className="shelf-title-row">
                <span className="shelf-title-main">
                  <span className="shelf-title-name">{it.title}</span>
                  <StatusPill status={it.status} />
                </span>
                <span
                  className="shelf-title-qty"
                  style={{ color: getCategoryColor(it.category) }}
                >
                  ×{it.quantity}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ---- Map of the rooms: each room, then its categories, then shelves ----
  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow">English Department</p>
        <h1>Shelf View</h1>
        <p className="muted">A map by room: what's on each shelf, and how many copies.</p>
      </header>

      {rooms.map((room) => (
        <section key={room.section} className="shelf-room section-gap" aria-label={room.section}>
          <div className="shelf-room-head">
            <span className="shelf-room-name">{room.section}</span>
            <span className="shelf-room-copies muted">
              {room.copies} {room.copies === 1 ? 'copy' : 'copies'}
            </span>
          </div>

          {room.categories.map(({ category, shelves, copies }) => {
            const color = getCategoryColor(category)
            return (
              <div key={category} className="shelf-cat" aria-label={category}>
                <div className="shelf-cat-head" style={{ ['--shelf-accent' as string]: color }}>
                  <span className="shelf-cat-name">{category}</span>
                  <span className="shelf-cat-copies">
                    {copies} {copies === 1 ? 'copy' : 'copies'}
                  </span>
                </div>

                <div className="shelf-grid">
                  {shelves.map((bucket) => {
                    const titles = bucket.items.length
                    return (
                      <button
                        key={bucket.shelf}
                        type="button"
                        className={'shelf-card card' + (bucket.flagged ? ' shelf-card--flag' : '')}
                        style={{ ['--shelf-accent' as string]: color }}
                        onClick={() => setSelected(bucket)}
                      >
                        <span className="shelf-card-id">
                          {bucket.shelf}
                          {bucket.flagged && (
                            <span className="shelf-card-warn" aria-label="needs attention">
                              ⚠
                            </span>
                          )}
                        </span>
                        <span className="shelf-card-meta muted">
                          {titles} {titles === 1 ? 'title' : 'titles'}
                        </span>
                        <span className="shelf-card-meta muted">
                          {bucket.copies} {bucket.copies === 1 ? 'copy' : 'copies'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      ))}

      {/* Always-present Unshelved catch-all */}
      <section className="section-gap" aria-label="Unshelved">
        {unshelved.length > 0 ? (
          <div className="shelf-unshelved card">
            <div className="shelf-unshelved-head">
              <span className="shelf-unshelved-title">⚠ Unshelved</span>
              <span className="muted">
                no location · {unshelved.length}{' '}
                {unshelved.length === 1 ? 'title' : 'titles'}
              </span>
            </div>
            <ul className="shelf-unshelved-list">
              {unshelved.map((it) => (
                <li key={it.id}>
                  <Link to={`/item/${it.id}`} className="shelf-unshelved-row">
                    <span className="shelf-unshelved-main">
                      <span className="shelf-title-name">{it.title}</span>
                      <CategoryBadge category={it.category} />
                    </span>
                    <span className="shelf-title-qty">×{it.quantity}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="shelf-all-clear muted">All items are shelved ✓</p>
        )}
      </section>
    </div>
  )
}

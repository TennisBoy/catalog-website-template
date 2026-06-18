import { Link } from 'react-router-dom'
import { useCatalog } from '../store/useCatalog'
import { UNCATEGORIZED } from '../types'
import { countsByCategory } from '../store/selectors'
import { titleCount, copyCount, relativeTime } from '../lib/format'
import { categoryColor } from '../data/categories'
import { CategoryBadge } from '../components/badges'
import { EmptyState } from '../components/EmptyState'
import './Dashboard.css'

const QUICK_ACTIONS = [
  { to: '/add', icon: '➕', label: 'Add item', hint: 'Catalog a new title' },
  { to: '/catalog', icon: '🔍', label: 'Search catalog', hint: 'Find anything fast' },
  { to: '/labels', icon: '🏷️', label: 'Print labels', hint: 'Shelf & category labels' },
  { to: '/export', icon: '⬇️', label: 'Export catalog', hint: 'CSV for the records' },
] as const

const uncatLink = `/catalog?cat=${encodeURIComponent(UNCATEGORIZED)}`

export function Dashboard() {
  const { items, readOnly } = useCatalog()

  // Hide the "Add item" shortcut for read-only visitors.
  const quickActions = readOnly ? QUICK_ACTIONS.filter((a) => a.to !== '/add') : QUICK_ACTIONS

  const titles = titleCount(items)
  const copies = copyCount(items)
  const byCategory = countsByCategory(items)
  const uncategorized = items.filter((it) => it.category === UNCATEGORIZED).length
  const categoriesUsed = byCategory.length

  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)

  if (items.length === 0) {
    return (
      <div className="page">
        <header className="page__head">
          <p className="eyebrow">English Department</p>
          <h1>Catalog</h1>
        </header>
        <EmptyState
          icon="📚"
          title="Your catalog is empty"
          hint={
            readOnly
              ? 'No items have been added to the catalog yet.'
              : "Add your first title to start cataloging the department's shelves."
          }
          actionLabel={readOnly ? undefined : 'Add the first item'}
          actionTo={readOnly ? undefined : '/add'}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow">English Department</p>
        <h1>Dashboard</h1>
        <p className="muted">A quick look at the catalog, and the four things you do most.</p>
      </header>

      {/* Stat cards */}
      <section className="dash-stats" aria-label="Catalog totals">
        <div className="dash-stat card">
          <span className="dash-stat__num">{titles.toLocaleString()}</span>
          <span className="dash-stat__label">Titles</span>
        </div>
        <div className="dash-stat card">
          <span className="dash-stat__num">{copies.toLocaleString()}</span>
          <span className="dash-stat__label">Copies</span>
        </div>
        <Link
          to={uncatLink}
          className={'dash-stat card dash-stat--link' + (uncategorized > 0 ? ' dash-stat--warn' : '')}
        >
          <span className="dash-stat__num">{uncategorized.toLocaleString()}</span>
          <span className="dash-stat__label">
            Uncategorized{uncategorized > 0 ? ', needs a home' : ''}
          </span>
        </Link>
        <div className="dash-stat card">
          <span className="dash-stat__num">{categoriesUsed.toLocaleString()}</span>
          <span className="dash-stat__label">Categories</span>
        </div>
      </section>

      {/* Quick actions */}
      <section className="section-gap" aria-label="Quick actions">
        <h2 className="dash-h2">Quick actions</h2>
        <div className="dash-actions">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className="dash-action card">
              <span className="dash-action__icon" aria-hidden>
                {a.icon}
              </span>
              <span className="dash-action__text">
                <span className="dash-action__label">{a.label}</span>
                <span className="dash-action__hint muted">{a.hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="dash-cols section-gap">
        {/* By category */}
        <section aria-label="By category">
          <h2 className="dash-h2">By category</h2>
          <ul className="dash-cat-list card">
            {byCategory.map((c) => (
              <li key={c.category}>
                <Link
                  to={`/catalog?cat=${encodeURIComponent(c.category)}`}
                  className="dash-cat-row"
                >
                  <CategoryBadge category={c.category} />
                  <span className="dash-cat-rule" aria-hidden />
                  <span className="dash-cat-count">{c.copies.toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Recently added */}
        <section aria-label="Recently added">
          <h2 className="dash-h2">Recently added</h2>
          <ul className="dash-recent card">
            {recent.map((it) => (
              <li key={it.id}>
                <Link to={`/item/${it.id}`} className="dash-recent-row">
                  <span className="dash-recent-main">
                    <span className="dash-recent-title">{it.title}</span>
                    <span
                      className="dash-recent-qty"
                      style={{ color: categoryColor(it.category) }}
                    >
                      ×{it.quantity}
                    </span>
                  </span>
                  <span className="dash-recent-meta muted">
                    {it.category}
                    {it.location.shelf.trim() !== '' && ` · Shelf ${it.location.shelf}`}
                    {' · '}
                    {relativeTime(it.updatedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Item } from '../types'
import type { SortKey, SortDir } from '../hooks/useCatalogSort'
import type { SelectionState } from '../hooks/useSelection'
import { relativeTime } from '../lib/format'
import { CategoryBadge, StatusPill } from './badges'

export interface CatalogTableProps {
  items: Item[]
  canSelect: boolean
  sel: SelectionState
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
}

export function CatalogTable({ items, canSelect, sel, sortKey, sortDir, onSort }: CatalogTableProps) {
  const navigate = useNavigate()

  const resultIds = items.map((r) => r.id)
  const allSelected = resultIds.length > 0 && resultIds.every((id) => sel.isSelected(id))
  const someSelected = resultIds.some((id) => sel.isSelected(id))

  function sortIndicator(key: SortKey): ReactNode {
    if (sortKey !== key) return null
    return <span className="cat-sort-arrow" aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  return (
    <>
      {/* Mobile: card list */}
      <ul className="cat-cards">
        {items.map((it) => (
          <li
            key={it.id}
            className={'cat-card-row' + (sel.isSelected(it.id) ? ' is-selected' : '')}
          >
            {canSelect && (
              <input
                type="checkbox"
                className="cat-card__check"
                checked={sel.isSelected(it.id)}
                onChange={() => sel.toggle(it.id)}
                aria-label={`Select ${it.title}`}
              />
            )}
            <Link to={`/item/${it.id}`} className="card cat-card">
              <div className="cat-card__top">
                <span className="cat-card__title">{it.title}</span>
                <span className="cat-card__qty">×{it.quantity}</span>
              </div>
              {it.author?.trim() && (
                <span className="cat-card__author muted">{it.author}</span>
              )}
              <div className="cat-card__tags">
                <CategoryBadge category={it.category} />
                <span className="cat-card__type muted">{it.materialType}</span>
              </div>
              <div className="cat-card__foot">
                <span className="cat-card__loc muted">
                  📍 {it.location.shelf || 'No shelf'}
                  {it.location.section.trim() ? ` · ${it.location.section}` : ''}
                </span>
                <span className="cat-card__time muted">{relativeTime(it.updatedAt)}</span>
                <StatusPill status={it.status} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="cat-table-wrap card">
        <table className="cat-table">
          <thead>
            <tr>
              {canSelect && (
                <th className="cat-th cat-th--check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected
                    }}
                    onChange={() => sel.toggleAll(resultIds)}
                    aria-label="Select all"
                  />
                </th>
              )}
              <Th label="Title" k="title" sortKey={sortKey} sortDir={sortDir} onSort={onSort} indicator={sortIndicator} />
              <th className="cat-th cat-th--plain">Author</th>
              <Th label="Qty" k="quantity" sortKey={sortKey} sortDir={sortDir} onSort={onSort} indicator={sortIndicator} align="right" />
              <Th label="Category" k="category" sortKey={sortKey} sortDir={sortDir} onSort={onSort} indicator={sortIndicator} />
              <Th label="Shelf" k="shelf" sortKey={sortKey} sortDir={sortDir} onSort={onSort} indicator={sortIndicator} />
              <th className="cat-th cat-th--plain">Room</th>
              <th className="cat-th cat-th--plain">Type</th>
              <th className="cat-th cat-th--plain">Notes</th>
              <Th label="Updated" k="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={onSort} indicator={sortIndicator} />
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <Row
                key={it.id}
                item={it}
                canSelect={canSelect}
                selected={sel.isSelected(it.id)}
                onToggle={() => sel.toggle(it.id)}
                onOpen={() => navigate(`/item/${it.id}`)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  indicator,
  align,
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
  indicator: (k: SortKey) => ReactNode
  align?: 'right'
}) {
  const ariaSort = sortKey !== k ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending'
  return (
    <th className={`cat-th${align === 'right' ? ' cat-th--right' : ''}`} aria-sort={ariaSort}>
      <button type="button" className="cat-th__btn" onClick={() => onSort(k)}>
        {label}
        {indicator(k)}
      </button>
    </th>
  )
}

function Row({
  item,
  canSelect,
  selected,
  onToggle,
  onOpen,
}: {
  item: Item
  canSelect: boolean
  selected: boolean
  onToggle: () => void
  onOpen: () => void
}) {
  return (
    <tr
      className={'cat-row' + (selected ? ' is-selected' : '')}
      tabIndex={0}
      role="link"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
    >
      {canSelect && (
        <td className="cat-td cat-td--check" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Select ${item.title}`}
          />
        </td>
      )}
      <td className="cat-td cat-td--title">
        {item.title}
        {item.status !== 'Cataloged' && (
          <span className="cat-warn" aria-label={item.status} title={item.status}>
            {' '}⚠
          </span>
        )}
      </td>
      <td className="cat-td cat-td--author muted">{item.author?.trim() || '-'}</td>
      <td className="cat-td cat-td--right">{item.quantity}</td>
      <td className="cat-td">
        <CategoryBadge category={item.category} />
      </td>
      <td className="cat-td">{item.location.shelf || '-'}</td>
      <td className="cat-td">{item.location.section.trim() || '-'}</td>
      <td className="cat-td">{item.materialType}</td>
      <td className="cat-td cat-td--notes muted">{item.notes?.trim() || '-'}</td>
      <td className="cat-td muted">{relativeTime(item.updatedAt)}</td>
    </tr>
  )
}

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Category, Item, MaterialType, Status } from '../types'
import { CATEGORIES, MATERIAL_TYPES, STATUSES, UNCATEGORIZED } from '../types'
import { useCatalog } from '../store/useCatalog'
import { relativeTime } from '../lib/format'
import { CategoryBadge, StatusPill } from '../components/badges'
import { EmptyState } from '../components/EmptyState'
import './Catalog.css'

type SortKey = 'title' | 'quantity' | 'category' | 'shelf' | 'updatedAt'
type SortDir = 'asc' | 'desc'

function isCategory(value: string | null): value is Category {
  return value != null && (CATEGORIES as readonly string[]).includes(value)
}

export function Catalog() {
  const { items, readOnly, bulkUpdate, bulkRemove } = useCatalog()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  // --- filter state, initialized from URL params on mount ---
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const [category, setCategory] = useState<Category | 'All'>(() => {
    const cat = params.get('cat')
    return isCategory(cat) ? cat : 'All'
  })
  const [materialType, setMaterialType] = useState<MaterialType | 'All'>('All')
  const [shelf, setShelf] = useState<string>('All')
  const [uncatOnly, setUncatOnly] = useState(() => params.get('uncat') === '1')

  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Reflect search text back into the URL (optional, keeps it shareable).
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (query.trim()) next.set('q', query.trim())
    else next.delete('q')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Distinct shelves present in the catalog, for the Location filter.
  const shelves = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) {
      const s = it.location.shelf?.trim()
      if (s) set.add(s)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [items])

  const anyFilterActive =
    query.trim() !== '' ||
    category !== 'All' ||
    materialType !== 'All' ||
    shelf !== 'All' ||
    uncatOnly

  function clearAll() {
    setQuery('')
    setCategory('All')
    setMaterialType('All')
    setShelf('All')
    setUncatOnly(false)
  }

  // --- filtering (AND) + sorting ---
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = items.filter((it) => {
      if (q) {
        const hay = `${it.title} ${it.author ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (uncatOnly && it.category !== UNCATEGORIZED) return false
      if (category !== 'All' && it.category !== category) return false
      if (materialType !== 'All' && it.materialType !== materialType) return false
      if (shelf !== 'All' && it.location.shelf !== shelf) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'quantity':
          cmp = a.quantity - b.quantity
          break
        case 'category':
          cmp = a.category.localeCompare(b.category)
          break
        case 'shelf':
          cmp = (a.location.shelf || '').localeCompare(b.location.shelf || '', undefined, {
            numeric: true,
          })
          break
        case 'updatedAt':
          cmp = a.updatedAt.localeCompare(b.updatedAt)
          break
      }
      return cmp * dir
    })
    return sorted
  }, [items, query, category, materialType, shelf, uncatOnly, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Sensible default direction per column.
      setSortDir(key === 'updatedAt' || key === 'quantity' ? 'desc' : 'asc')
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null
    return <span className="cat-sort-arrow" aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>
  }

  // --- bulk selection (editor only) ---
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [showLoc, setShowLoc] = useState(false)
  const [bulkSection, setBulkSection] = useState('')
  const [bulkShelf, setBulkShelf] = useState('')

  const resultIds = results.map((r) => r.id)
  const allSelected = resultIds.length > 0 && resultIds.every((id) => selected.has(id))
  const someSelected = resultIds.some((id) => selected.has(id))
  const selectedIds = [...selected]
  const canSelect = !readOnly

  function toggleOne(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  function toggleAll() {
    setSelected((s) => {
      const n = new Set(s)
      if (allSelected) resultIds.forEach((id) => n.delete(id))
      else resultIds.forEach((id) => n.add(id))
      return n
    })
  }
  function clearSel() {
    setSelected(new Set())
    setShowLoc(false)
  }
  function applyCategory(c: string) {
    if (!c) return
    bulkUpdate(selectedIds, { category: c as Category })
    clearSel()
  }
  function applyStatus(s: string) {
    if (!s) return
    bulkUpdate(selectedIds, { status: s as Status })
    clearSel()
  }
  function applyLocation() {
    bulkUpdate(selectedIds, { location: { section: bulkSection.trim(), shelf: bulkShelf.trim() } })
    setBulkSection('')
    setBulkShelf('')
    clearSel()
  }
  function applyDelete() {
    if (window.confirm(`Delete ${selectedIds.length} item(s)? This can't be undone.`)) {
      bulkRemove(selectedIds)
      clearSel()
    }
  }

  const catalogEmpty = items.length === 0

  return (
    <div className="page">
      <div className="page__head">
        <p className="eyebrow">Catalog</p>
        <h1>Find anything</h1>
      </div>

      {/* Sticky search + filters */}
      <div className="cat-controls">
        <div className="cat-search">
          <span className="cat-search__icon" aria-hidden>🔍</span>
          <input
            className="input cat-search__input"
            type="search"
            inputMode="search"
            placeholder="Search title or author…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search by title or author"
          />
          {query && (
            <button
              type="button"
              className="cat-search__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ⌫
            </button>
          )}
        </div>

        <div className="cat-filters">
          <label className="cat-filter">
            <span className="cat-filter__label">Category</span>
            <select
              className="input cat-select"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value === 'All' ? 'All' : (e.target.value as Category))
              }
            >
              <option value="All">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="cat-filter">
            <span className="cat-filter__label">Type</span>
            <select
              className="input cat-select"
              value={materialType}
              onChange={(e) =>
                setMaterialType(
                  e.target.value === 'All' ? 'All' : (e.target.value as MaterialType),
                )
              }
            >
              <option value="All">All types</option>
              {MATERIAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="cat-filter">
            <span className="cat-filter__label">Shelf</span>
            <select
              className="input cat-select"
              value={shelf}
              onChange={(e) => setShelf(e.target.value)}
              disabled={shelves.length === 0}
            >
              <option value="All">All shelves</option>
              {shelves.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="cat-toggle">
            <input
              type="checkbox"
              checked={uncatOnly}
              onChange={(e) => setUncatOnly(e.target.checked)}
            />
            <span>Uncategorized only</span>
          </label>
        </div>

        <div className="cat-meta">
          {canSelect && results.length > 0 && (
            <label className="cat-selectall">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onChange={toggleAll}
              />
              <span>Select all</span>
            </label>
          )}
          <span className="cat-count muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
          {anyFilterActive && (
            <button type="button" className="btn btn--ghost cat-clear" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar (editor only) */}
      {canSelect && selected.size > 0 && (
        <div className="cat-bulkbar">
          <div className="cat-bulkbar__count">
            <strong>{selected.size}</strong> selected
            <button type="button" className="btn btn--ghost cat-bulk-clear" onClick={clearSel}>
              Clear
            </button>
          </div>
          <div className="cat-bulkbar__actions">
            <select
              className="input cat-bulk-select"
              value=""
              onChange={(e) => applyCategory(e.target.value)}
              aria-label="Change category for selected"
            >
              <option value="" disabled>
                Change category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="input cat-bulk-select"
              value=""
              onChange={(e) => applyStatus(e.target.value)}
              aria-label="Change status for selected"
            >
              <option value="" disabled>
                Change status…
              </option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button type="button" className="btn" onClick={() => setShowLoc((v) => !v)}>
              Set location…
            </button>
            <button type="button" className="btn btn--danger" onClick={applyDelete}>
              Delete
            </button>
          </div>
          {showLoc && (
            <div className="cat-bulkloc">
              <input
                className="input"
                placeholder="Section (e.g. Room 1)"
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
              />
              <input
                className="input"
                placeholder="Shelf (optional)"
                value={bulkShelf}
                onChange={(e) => setBulkShelf(e.target.value)}
              />
              <button type="button" className="btn btn--primary" onClick={applyLocation}>
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="section-gap">
          <EmptyState
            icon={catalogEmpty ? '📚' : '🔍'}
            title={catalogEmpty ? 'No items yet' : 'No items match your filters'}
            hint={
              catalogEmpty
                ? 'Add your first title to start the catalog.'
                : 'Try clearing a filter or searching for something else.'
            }
            actionLabel={catalogEmpty ? 'Add your first item' : undefined}
            actionTo={catalogEmpty ? '/add' : undefined}
          />
        </div>
      ) : (
        <>
          {/* Mobile: card list */}
          <ul className="cat-cards">
            {results.map((it) => (
              <li
                key={it.id}
                className={'cat-card-row' + (selected.has(it.id) ? ' is-selected' : '')}
              >
                {canSelect && (
                  <input
                    type="checkbox"
                    className="cat-card__check"
                    checked={selected.has(it.id)}
                    onChange={() => toggleOne(it.id)}
                    aria-label={`Select ${it.title}`}
                  />
                )}
                <Link to={`/item/${it.id}`} className="card cat-card">
                  <div className="cat-card__top">
                    <span className="cat-card__title">{it.title}</span>
                    <span className="cat-card__qty">×{it.quantity}</span>
                  </div>
                  <div className="cat-card__tags">
                    <CategoryBadge category={it.category} />
                    <span className="cat-card__type muted">{it.materialType}</span>
                  </div>
                  <div className="cat-card__foot">
                    <span className="cat-card__loc muted">
                      📍 {it.location.shelf || 'No shelf'}
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
                        onChange={toggleAll}
                        aria-label="Select all"
                      />
                    </th>
                  )}
                  <Th label="Title" k="title" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} indicator={sortIndicator} />
                  <Th label="Qty" k="quantity" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} indicator={sortIndicator} align="right" />
                  <Th label="Category" k="category" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} indicator={sortIndicator} />
                  <Th label="Shelf" k="shelf" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} indicator={sortIndicator} />
                  <th className="cat-th cat-th--plain">Type</th>
                  <th className="cat-th cat-th--plain">Notes</th>
                  <Th label="Updated" k="updatedAt" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} indicator={sortIndicator} />
                </tr>
              </thead>
              <tbody>
                {results.map((it) => (
                  <Row
                    key={it.id}
                    item={it}
                    canSelect={canSelect}
                    selected={selected.has(it.id)}
                    onToggle={() => toggleOne(it.id)}
                    onOpen={() => navigate(`/item/${it.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
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
      <td className="cat-td cat-td--right">{item.quantity}</td>
      <td className="cat-td">
        <CategoryBadge category={item.category} />
      </td>
      <td className="cat-td">{item.location.shelf || '-'}</td>
      <td className="cat-td">{item.materialType}</td>
      <td className="cat-td cat-td--notes muted">{item.notes?.trim() || '-'}</td>
      <td className="cat-td muted">{relativeTime(item.updatedAt)}</td>
    </tr>
  )
}

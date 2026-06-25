import { useState } from 'react'
import type { Category, Status } from '../types'
import { CATEGORIES, MATERIAL_TYPES, STATUSES } from '../types'
import { useCatalog } from '../store/useCatalog'
import { EmptyState } from '../components/EmptyState'
import { ActiveFilterChips } from '../components/ActiveFilterChips'
import { CatalogTable } from '../components/CatalogTable'
import { useAddPanel } from '../components/addPanelContext'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import { useCatalogSort } from '../hooks/useCatalogSort'
import { useInfiniteList } from '../hooks/useInfiniteList'
import { useSelection } from '../hooks/useSelection'
import './Catalog.css'

export function Catalog() {
  const { items, readOnly, bulkUpdate, bulkRemove } = useCatalog()

  // --- filters ---
  const { filtered, filters } = useCatalogFilters(items)

  // --- sort ---
  const { sorted: results, sortKey, setSortKey, sortDir, setSortDir } = useCatalogSort(filtered)

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      // Sensible default direction per column.
      setSortDir(key === 'updatedAt' || key === 'quantity' ? 'desc' : 'asc')
    }
  }

  // --- Add item (opens the global full-screen overlay, no navigation) ---
  const openAdd = useAddPanel()

  // --- infinite scroll ---
  const { visible, hasMore, sentinelRef } = useInfiniteList(results)

  // --- bulk selection (editor only) ---
  const sel = useSelection()
  const [showLoc, setShowLoc] = useState(false)
  const [bulkSection, setBulkSection] = useState('')
  const [bulkShelf, setBulkShelf] = useState('')

  const resultIds = results.map((r) => r.id)
  const allSelected = resultIds.length > 0 && resultIds.every((id) => sel.isSelected(id))
  const someSelected = resultIds.some((id) => sel.isSelected(id))
  const selectedIds = [...sel.selectedIds]
  const canSelect = !readOnly

  function clearSel() {
    sel.clear()
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
      <div className="page__head cat-head">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>Find anything</h1>
        </div>
        {!readOnly && (
          <button type="button" className="btn btn--primary cat-head__add" onClick={openAdd}>
            ＋ Add item
          </button>
        )}
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
            value={filters.query}
            onChange={(e) => filters.setQuery(e.target.value)}
            aria-label="Search by title or author"
          />
          {filters.query && (
            <button
              type="button"
              className="cat-search__clear"
              onClick={() => filters.setQuery('')}
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
              value={filters.category}
              onChange={(e) =>
                filters.setCategory(e.target.value === 'All' ? 'All' : (e.target.value as Category))
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
              value={filters.materialType}
              onChange={(e) =>
                filters.setMaterialType(
                  e.target.value === 'All' ? 'All' : (e.target.value as typeof filters.materialType),
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
              value={filters.shelf}
              onChange={(e) => filters.setShelf(e.target.value)}
              disabled={filters.shelves.length === 0}
            >
              <option value="All">All shelves</option>
              {filters.shelves.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="cat-toggle">
            <input
              type="checkbox"
              checked={filters.uncatOnly}
              onChange={(e) => filters.setUncatOnly(e.target.checked)}
            />
            <span>Uncategorized only</span>
          </label>
        </div>

        {/* Active filter chips, one per active filter, each removable */}
        <ActiveFilterChips filters={filters} />

        <div className="cat-meta">
          {canSelect && results.length > 0 && (
            <label className="cat-selectall">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onChange={() => sel.toggleAll(resultIds)}
              />
              <span>Select all</span>
            </label>
          )}
          <span className="cat-count muted">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </span>
          {filters.anyActive && (
            <button type="button" className="btn btn--ghost cat-clear" onClick={filters.clear}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Bulk action bar (editor only) */}
      {canSelect && sel.count > 0 && (
        <div className="cat-bulkbar">
          <div className="cat-bulkbar__count">
            <strong>{sel.count}</strong> selected
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
                placeholder="Room (e.g. Room 1)"
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
            actionLabel={catalogEmpty && !readOnly ? 'Add your first item' : undefined}
            onAction={catalogEmpty && !readOnly ? openAdd : undefined}
          />
          {!catalogEmpty && filters.anyActive && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--s4)' }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={filters.clear}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <CatalogTable
            items={visible}
            canSelect={canSelect}
            sel={sel}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          {hasMore && <div ref={sentinelRef} className="cat-sentinel" aria-hidden />}
          <p className="cat-showing muted">
            Showing {visible.length} of {results.length}
          </p>
        </>
      )}
    </div>
  )
}

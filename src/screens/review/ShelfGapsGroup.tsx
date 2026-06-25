import { useState } from 'react'
import type { Item } from '../../types'
import { useCatalog } from '../../store/useCatalog'
import { CategoryBadge } from '../../components/badges'
import { useSelection } from '../../hooks/useSelection'
import { SelectAll, RowCheck } from './shared'

function NoLocationRow({
  item,
  selected,
  onToggle,
  onSave,
}: {
  item: Item
  selected: boolean
  onToggle: () => void
  onSave: (shelf: string, section: string, dismiss: boolean) => void
}) {
  const [shelf, setShelf] = useState('')
  const [section, setSection] = useState(item.location.section)
  const [confirming, setConfirming] = useState(false)

  function handleSave() {
    if (shelf.trim()) {
      onSave(shelf.trim(), section.trim(), false) // has a shelf: leaves the list
    } else {
      setConfirming(true) // blank shelf: ask before dismissing
    }
  }

  return (
    <li className="rev-row">
      <RowCheck checked={selected} onChange={onToggle} label={`Select ${item.title}`} />
      <div className="rev-row__main">
        <span className="rev-row__title">{item.title}</span>
        <CategoryBadge category={item.category} />
      </div>
      <div className="rev-row__actions rev-row__actions--loc">
        <input
          className="input rev-input"
          placeholder="Shelf (e.g. A1)"
          value={shelf}
          onChange={(e) => setShelf(e.target.value)}
          aria-label={`Shelf for ${item.title}`}
        />
        <input
          className="input rev-input"
          placeholder="Room (optional)"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          aria-label={`Room for ${item.title}`}
        />
        {confirming ? (
          <>
            <button
              type="button"
              className="btn btn--primary rev-btn-sm"
              onClick={() => {
                onSave('', section.trim(), true)
                setConfirming(false)
              }}
            >
              Save without a shelf
            </button>
            <button type="button" className="btn btn--ghost rev-btn-sm" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary rev-btn-sm" onClick={handleSave}>
            Save
          </button>
        )}
      </div>
    </li>
  )
}

/* ---- Group 4: No shelf / location ----
 * Lists every item without a shelf so the head can optionally give some a shelf.
 * A shelf is never required. Saving an actual shelf removes the item from the
 * list. Saving with a BLANK shelf asks for a confirm ("Save without a shelf"),
 * which marks the item "no shelf needed" (shelfDismissed) and removes it too.
 * Bulk action marks all selected as "no shelf needed".
 */
export function NoLocationGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection()
  const ids = items.map((i) => i.id)
  const allSelected = ids.length > 0 && ids.every((id) => sel.isSelected(id))
  const someSelected = ids.some((id) => sel.isSelected(id))
  const selectedIds = ids.filter((id) => sel.isSelected(id))
  const [bulkSection, setBulkSection] = useState('')

  function dismissBulk() {
    const section = bulkSection.trim()
    // Set a section only if one was typed (otherwise keep each item's own).
    bulkUpdate(
      selectedIds,
      section ? { shelfDismissed: true, location: { shelf: '', section } } : { shelfDismissed: true },
    )
    setBulkSection('')
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={allSelected} someSelected={someSelected} onToggle={() => sel.toggleAll(ids)} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <NoLocationRow
            key={item.id}
            item={item}
            selected={sel.isSelected(item.id)}
            onToggle={() => sel.toggle(item.id)}
            onSave={(shelf, section, dismiss) =>
              updateItem(item.id, {
                location: { ...item.location, shelf, section: section || item.location.section },
                ...(dismiss ? { shelfDismissed: true } : {}),
              })
            }
          />
        ))}
      </ul>
      {selectedIds.length > 0 && (
        <div className="rev-bulkbar rev-bulkbar--wrap">
          <span className="rev-bulkbar__count">
            <strong>{selectedIds.length}</strong> selected
          </span>
          <input className="input rev-input" placeholder="Room (optional, e.g. Room 1)" value={bulkSection} onChange={(e) => setBulkSection(e.target.value)} />
          <button type="button" className="btn btn--primary rev-btn-sm" onClick={dismissBulk}>
            Mark as no shelf needed
          </button>
          <button type="button" className="btn btn--ghost rev-btn-sm" onClick={sel.clear}>
            Clear
          </button>
        </div>
      )}
    </>
  )
}

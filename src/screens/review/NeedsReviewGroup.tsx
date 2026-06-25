import { Link } from 'react-router-dom'
import type { Item } from '../../types'
import { useCatalog } from '../../store/useCatalog'
import { useSelection } from '../../hooks/useSelection'
import { SelectAll, RowCheck } from './shared'

export function NeedsReviewGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection()
  const ids = items.map((i) => i.id)
  const allSelected = ids.length > 0 && ids.every((id) => sel.isSelected(id))
  const someSelected = ids.some((id) => sel.isSelected(id))
  const selectedIds = ids.filter((id) => sel.isSelected(id))

  function applyBulk() {
    bulkUpdate(selectedIds, { status: 'Cataloged' })
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={allSelected} someSelected={someSelected} onToggle={() => sel.toggleAll(ids)} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <li className="rev-row" key={item.id}>
            <RowCheck checked={sel.isSelected(item.id)} onChange={() => sel.toggle(item.id)} label={`Select ${item.title}`} />
            <div className="rev-row__main rev-row__main--col">
              <span className="rev-row__title">{item.title}</span>
              {item.notes?.trim() ? (
                <span className="rev-row__notes muted">“{item.notes}”</span>
              ) : (
                <span className="rev-row__notes muted">No note. Open to review.</span>
              )}
            </div>
            <div className="rev-row__actions">
              <button type="button" className="btn btn--primary rev-btn-sm" onClick={() => updateItem(item.id, { status: 'Cataloged' })}>
                Mark cataloged
              </button>
              <Link to={`/item/${item.id}`} className="btn btn--ghost rev-btn-sm">
                Open
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{selectedIds.length}</strong> selected
          </span>
          <button type="button" className="btn btn--primary rev-btn-sm" onClick={applyBulk}>
            Mark selected cataloged
          </button>
          <button type="button" className="btn btn--ghost rev-btn-sm" onClick={sel.clear}>
            Clear
          </button>
        </div>
      )}
    </>
  )
}

import { useState } from 'react'
import type { Item, Category } from '../../types'
import { CATEGORIES, UNCATEGORIZED } from '../../types'
import { useCatalog } from '../../store/useCatalog'
import { CATEGORY_META } from '../../data/categories'
import { getCategoryColor } from '../../lib/categoryColor'
import { ChipGroup, Chip } from '../../components/chips'
import { useSelection } from '../../hooks/useSelection'
import { SelectAll, RowCheck } from './shared'

const ASSIGNABLE: Category[] = CATEGORIES.filter((c) => c !== UNCATEGORIZED)

export function UncategorizedGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection()
  const ids = items.map((i) => i.id)
  const allSelected = ids.length > 0 && ids.every((id) => sel.isSelected(id))
  const someSelected = ids.some((id) => sel.isSelected(id))
  const selectedIds = ids.filter((id) => sel.isSelected(id))
  const [picking, setPicking] = useState<string | null>(null) // item id with open picker
  const [bulkPicking, setBulkPicking] = useState(false)

  function assignOne(item: Item, category: Category) {
    const section = CATEGORY_META[category].section || item.location.section
    updateItem(item.id, { category, location: { ...item.location, section } })
    setPicking(null)
  }
  function assignBulk(category: Category) {
    bulkUpdate(selectedIds, { category })
    setBulkPicking(false)
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
            <div className="rev-row__main">
              <span className="rev-row__title">{item.title}</span>
              <span className="rev-row__qty">×{item.quantity}</span>
            </div>
            {picking === item.id ? (
              <ChipGroup>
                {ASSIGNABLE.map((c) => (
                  <Chip key={c} selected={false} color={getCategoryColor(c)} onClick={() => assignOne(item, c)}>
                    {CATEGORY_META[c].short}
                  </Chip>
                ))}
              </ChipGroup>
            ) : (
              <div className="rev-row__actions">
                <button type="button" className="btn btn--primary rev-btn-sm" onClick={() => setPicking(item.id)}>
                  Assign category
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{selectedIds.length}</strong> selected
          </span>
          {bulkPicking ? (
            <ChipGroup>
              {ASSIGNABLE.map((c) => (
                <Chip key={c} selected={false} color={getCategoryColor(c)} onClick={() => assignBulk(c)}>
                  {CATEGORY_META[c].short}
                </Chip>
              ))}
            </ChipGroup>
          ) : (
            <button type="button" className="btn btn--primary rev-btn-sm" onClick={() => setBulkPicking(true)}>
              Assign category to selected
            </button>
          )}
          <button type="button" className="btn btn--ghost rev-btn-sm" onClick={sel.clear}>
            Clear
          </button>
        </div>
      )}
    </>
  )
}

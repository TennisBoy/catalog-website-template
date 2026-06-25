import { useState } from 'react'
import type { Item } from '../../types'
import { useCatalog } from '../../store/useCatalog'
import { QuantityStepper } from '../../components/QuantityStepper'
import { useSelection } from '../../hooks/useSelection'
import { SelectAll, RowCheck } from './shared'

function MissingQtyRow({
  item,
  selected,
  onToggle,
  onSet,
}: {
  item: Item
  selected: boolean
  onToggle: () => void
  onSet: (q: number) => void
}) {
  const [value, setValue] = useState(item.quantity > 0 ? item.quantity : 1)
  return (
    <li className="rev-row">
      <RowCheck checked={selected} onChange={onToggle} label={`Select ${item.title}`} />
      <div className="rev-row__main">
        <span className="rev-row__title">{item.title}</span>
        <span className="rev-row__qty rev-row__qty--missing">qty?</span>
      </div>
      <div className="rev-row__actions rev-row__actions--qty">
        <QuantityStepper value={value} onChange={setValue} />
        <button type="button" className="btn btn--primary rev-btn-sm" disabled={!(value > 0)} onClick={() => onSet(value)}>
          Set
        </button>
      </div>
    </li>
  )
}

export function MissingQtyGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection()
  const ids = items.map((i) => i.id)
  const allSelected = ids.length > 0 && ids.every((id) => sel.isSelected(id))
  const someSelected = ids.some((id) => sel.isSelected(id))
  const selectedIds = ids.filter((id) => sel.isSelected(id))
  const [bulkQty, setBulkQty] = useState(1)

  function applyBulk() {
    if (!(bulkQty > 0)) return
    bulkUpdate(selectedIds, { quantity: bulkQty })
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={allSelected} someSelected={someSelected} onToggle={() => sel.toggleAll(ids)} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <MissingQtyRow key={item.id} item={item} selected={sel.isSelected(item.id)} onToggle={() => sel.toggle(item.id)} onSet={(q) => updateItem(item.id, { quantity: q })} />
        ))}
      </ul>
      {selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{selectedIds.length}</strong> selected
          </span>
          <QuantityStepper value={bulkQty} onChange={setBulkQty} />
          <button type="button" className="btn btn--primary rev-btn-sm" disabled={!(bulkQty > 0)} onClick={applyBulk}>
            Set for selected
          </button>
          <button type="button" className="btn btn--ghost rev-btn-sm" onClick={sel.clear}>
            Clear
          </button>
        </div>
      )}
    </>
  )
}

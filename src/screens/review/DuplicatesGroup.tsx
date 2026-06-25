import type { Item } from '../../types'
import { useCatalog } from '../../store/useCatalog'

export function DuplicateRow({ items }: { items: Item[] }) {
  const { mergeMany, bulkUpdate, bulkRemove } = useCatalog()
  const keep = items.reduce((a, b) => (b.quantity > a.quantity ? b : a), items[0])

  // Merge: fold every row into the largest one, SUMMING the copies.
  function merge() {
    mergeMany(keep.id, items.filter((it) => it.id !== keep.id).map((it) => it.id))
  }
  // Keep only this row: delete the other rows, leaving this one's count unchanged
  // (for when the same physical copies were entered more than once).
  function keepOnly(id: string) {
    bulkRemove(items.filter((it) => it.id !== id).map((it) => it.id))
  }
  // Keep both: these aren't really duplicates. Mark every row "not a duplicate"
  // so the group leaves the list for good, and clear any "Duplicate possible" flag.
  function keepBoth() {
    bulkUpdate(items.map((it) => it.id), { dupDismissed: true })
    const flagged = items.filter((it) => it.status === 'Duplicate possible').map((it) => it.id)
    if (flagged.length) bulkUpdate(flagged, { status: 'Cataloged' })
  }

  return (
    <li className="rev-row rev-row--dup">
      <ul className="rev-dup-items">
        {items.map((it) => (
          <li key={it.id} className={'rev-dup-item' + (it.id === keep.id ? ' rev-dup-item--keep' : '')}>
            <span className="rev-dup-item__title">{it.title}</span>
            <span className="rev-dup-item__meta muted">
              {it.location.shelf.trim() ? `Shelf ${it.location.shelf}` : 'No shelf'} · ×{it.quantity}
              {it.id === keep.id && <span className="rev-dup-item__keep-tag"> · keep</span>}
            </span>
            <button
              type="button"
              className="btn btn--ghost rev-btn-sm rev-dup-item__keep-btn"
              onClick={() => keepOnly(it.id)}
              title={`Delete the other ${items.length - 1 === 1 ? 'row' : 'rows'} and keep only this one`}
            >
              Keep only this
            </button>
          </li>
        ))}
      </ul>
      <div className="rev-row__actions">
        <button type="button" className="btn btn--primary rev-btn-sm" onClick={merge}>
          Merge into one (×{items.reduce((s, it) => s + it.quantity, 0)})
        </button>
        <button type="button" className="btn btn--ghost rev-btn-sm" onClick={keepBoth}>
          Keep both
        </button>
      </div>
    </li>
  )
}

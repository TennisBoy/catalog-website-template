import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import type { Item, Category } from '../types'
import { CATEGORIES, UNCATEGORIZED } from '../types'
import { useCatalog } from '../store/useCatalog'
import { reviewBuckets, attentionCount } from '../store/selectors'
import { CATEGORY_META, categoryColor } from '../data/categories'
import { ChipGroup, Chip } from '../components/chips'
import { QuantityStepper } from '../components/QuantityStepper'
import { CategoryBadge } from '../components/badges'
import { EmptyState } from '../components/EmptyState'
import './Review.css'

const ASSIGNABLE: Category[] = CATEGORIES.filter((c) => c !== UNCATEGORIZED)

/** Per-group multi-select state. selectedIds is pruned to items still present. */
function useSelection(ids: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id))
  const someSelected = ids.some((id) => selected.has(id))
  function toggle(id: string) {
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
      if (allSelected) ids.forEach((id) => n.delete(id))
      else ids.forEach((id) => n.add(id))
      return n
    })
  }
  function clear() {
    setSelected(new Set())
  }
  return { allSelected, someSelected, toggle, toggleAll, clear, selectedIds: ids.filter((id) => selected.has(id)), has: (id: string) => selected.has(id) }
}

function SelectAll({
  allSelected,
  someSelected,
  onToggle,
}: {
  allSelected: boolean
  someSelected: boolean
  onToggle: () => void
}) {
  return (
    <label className="rev-selectall">
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = someSelected && !allSelected
        }}
        onChange={onToggle}
      />
      <span>Select all</span>
    </label>
  )
}

function RowCheck({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <input type="checkbox" className="rev-check" checked={checked} onChange={onChange} aria-label={label} />
  )
}

/** Collapsible group shell. Default-open when it holds anything. */
function ReviewGroup({
  title,
  hint,
  count,
  tone,
  children,
}: {
  title: string
  hint: string
  count: number
  tone: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(count > 0)
  return (
    <section className="rev-group card" style={{ '--rev-tone': tone } as CSSProperties}>
      <button
        type="button"
        className="rev-group__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="rev-group__chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
        <span className="rev-group__title">{title}</span>
        <span className="rev-group__count">{count}</span>
      </button>
      {open && (
        <div className="rev-group__body">
          <p className="rev-group__hint muted">{hint}</p>
          {children}
        </div>
      )}
    </section>
  )
}

/* ---- Group 1: Uncategorized ---- */
function UncategorizedGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection(items.map((i) => i.id))
  const [picking, setPicking] = useState<string | null>(null) // item id with open picker
  const [bulkPicking, setBulkPicking] = useState(false)

  function assignOne(item: Item, category: Category) {
    const section = CATEGORY_META[category].section || item.location.section
    updateItem(item.id, { category, location: { ...item.location, section } })
    setPicking(null)
  }
  function assignBulk(category: Category) {
    bulkUpdate(sel.selectedIds, { category })
    setBulkPicking(false)
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={sel.allSelected} someSelected={sel.someSelected} onToggle={sel.toggleAll} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <li className="rev-row" key={item.id}>
            <RowCheck checked={sel.has(item.id)} onChange={() => sel.toggle(item.id)} label={`Select ${item.title}`} />
            <div className="rev-row__main">
              <span className="rev-row__title">{item.title}</span>
              <span className="rev-row__qty">×{item.quantity}</span>
            </div>
            {picking === item.id ? (
              <ChipGroup>
                {ASSIGNABLE.map((c) => (
                  <Chip key={c} selected={false} color={categoryColor(c)} onClick={() => assignOne(item, c)}>
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
      {sel.selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{sel.selectedIds.length}</strong> selected
          </span>
          {bulkPicking ? (
            <ChipGroup>
              {ASSIGNABLE.map((c) => (
                <Chip key={c} selected={false} color={categoryColor(c)} onClick={() => assignBulk(c)}>
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

/* ---- Group 2: Possible duplicates (group-based; no row select) ---- */
function DuplicateRow({ items }: { items: Item[] }) {
  const { mergeDuplicate, updateItem } = useCatalog()
  const keep = items.reduce((a, b) => (b.quantity > a.quantity ? b : a), items[0])

  function merge() {
    for (const it of items) if (it.id !== keep.id) mergeDuplicate(keep.id, it.id)
  }
  function dismiss() {
    for (const it of items) if (it.status === 'Duplicate possible') updateItem(it.id, { status: 'Cataloged' })
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
          </li>
        ))}
      </ul>
      <div className="rev-row__actions">
        <button type="button" className="btn btn--primary rev-btn-sm" onClick={merge}>
          Merge into one (×{items.reduce((s, it) => s + it.quantity, 0)})
        </button>
        <button type="button" className="btn btn--ghost rev-btn-sm" onClick={dismiss}>
          Keep both
        </button>
      </div>
    </li>
  )
}

/* ---- Group 3: Missing quantity ---- */
function MissingQtyGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection(items.map((i) => i.id))
  const [bulkQty, setBulkQty] = useState(1)

  function applyBulk() {
    if (!(bulkQty > 0)) return
    bulkUpdate(sel.selectedIds, { quantity: bulkQty })
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={sel.allSelected} someSelected={sel.someSelected} onToggle={sel.toggleAll} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <MissingQtyRow key={item.id} item={item} selected={sel.has(item.id)} onToggle={() => sel.toggle(item.id)} onSet={(q) => updateItem(item.id, { quantity: q })} />
        ))}
      </ul>
      {sel.selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{sel.selectedIds.length}</strong> selected
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

/* ---- Group 4: No shelf / location ----
 * Lists every item without a shelf so the head can optionally give some of them
 * a shelf. A shelf is NOT required: saving with a blank shelf is allowed and the
 * item simply stays listed (it isn't auto-removed just because it has a section).
 * Add a shelf to the few you want shelved; leave the rest as they are.
 */
function NoLocationGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection(items.map((i) => i.id))
  const [bulkShelf, setBulkShelf] = useState('')
  const [bulkSection, setBulkSection] = useState('')

  function applyBulk() {
    bulkUpdate(sel.selectedIds, { location: { shelf: bulkShelf.trim(), section: bulkSection.trim() } })
    setBulkShelf('')
    setBulkSection('')
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={sel.allSelected} someSelected={sel.someSelected} onToggle={sel.toggleAll} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <NoLocationRow
            key={item.id}
            item={item}
            selected={sel.has(item.id)}
            onToggle={() => sel.toggle(item.id)}
            onSave={(shelf, section) =>
              updateItem(item.id, {
                location: { ...item.location, shelf, section: section || item.location.section },
              })
            }
          />
        ))}
      </ul>
      {sel.selectedIds.length > 0 && (
        <div className="rev-bulkbar rev-bulkbar--wrap">
          <span className="rev-bulkbar__count">
            <strong>{sel.selectedIds.length}</strong> selected
          </span>
          <input className="input rev-input" placeholder="Shelf (optional)" value={bulkShelf} onChange={(e) => setBulkShelf(e.target.value)} />
          <input className="input rev-input" placeholder="Section (e.g. Room 1)" value={bulkSection} onChange={(e) => setBulkSection(e.target.value)} />
          <button type="button" className="btn btn--primary rev-btn-sm" onClick={applyBulk}>
            Save for selected
          </button>
          <button type="button" className="btn btn--ghost rev-btn-sm" onClick={sel.clear}>
            Clear
          </button>
        </div>
      )}
    </>
  )
}

function NoLocationRow({
  item,
  selected,
  onToggle,
  onSave,
}: {
  item: Item
  selected: boolean
  onToggle: () => void
  onSave: (shelf: string, section: string) => void
}) {
  const [shelf, setShelf] = useState('')
  const [section, setSection] = useState(item.location.section)
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
          placeholder="Section (optional)"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          aria-label={`Section for ${item.title}`}
        />
        <button type="button" className="btn btn--primary rev-btn-sm" onClick={() => onSave(shelf.trim(), section.trim())}>
          Save
        </button>
      </div>
    </li>
  )
}

/* ---- Group 5: Needs review ---- */
function NeedsReviewGroup({ items }: { items: Item[] }) {
  const { updateItem, bulkUpdate } = useCatalog()
  const sel = useSelection(items.map((i) => i.id))

  function applyBulk() {
    bulkUpdate(sel.selectedIds, { status: 'Cataloged' })
    sel.clear()
  }

  return (
    <>
      {items.length > 1 && (
        <SelectAll allSelected={sel.allSelected} someSelected={sel.someSelected} onToggle={sel.toggleAll} />
      )}
      <ul className="rev-list">
        {items.map((item) => (
          <li className="rev-row" key={item.id}>
            <RowCheck checked={sel.has(item.id)} onChange={() => sel.toggle(item.id)} label={`Select ${item.title}`} />
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
      {sel.selectedIds.length > 0 && (
        <div className="rev-bulkbar">
          <span className="rev-bulkbar__count">
            <strong>{sel.selectedIds.length}</strong> selected
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

export function Review() {
  const { items } = useCatalog()
  const buckets = reviewBuckets(items)
  const total = attentionCount(buckets)

  return (
    <div className="page">
      <header className="page__head">
        <p className="eyebrow">English Department</p>
        <h1>Review &amp; Cleanup</h1>
        {total > 0 ? (
          <p className="rev-count">
            <strong>{total}</strong> {total === 1 ? 'item needs' : 'items need'} attention
          </p>
        ) : (
          <p className="muted">Every gap in the catalog, gathered into one tidy to-do list.</p>
        )}
      </header>

      {total === 0 ? (
        <EmptyState
          icon="🎉"
          title="Everything's tidy"
          hint="No uncategorized items, missing quantities, empty shelves, duplicates, or flags. Nicely done."
        />
      ) : (
        <div className="rev-groups">
          <ReviewGroup
            title="Uncategorized"
            hint="Give each item a category. Tick several and assign them all at once."
            count={buckets.uncategorized.length}
            tone={categoryColor(UNCATEGORIZED)}
          >
            <UncategorizedGroup items={buckets.uncategorized} />
          </ReviewGroup>

          <ReviewGroup
            title="Possible duplicates"
            hint="The same edition on more than one row. Merge folds copies into one, or keep both to dismiss."
            count={buckets.duplicateGroups.length}
            tone="#7c3aed"
          >
            <ul className="rev-list">
              {buckets.duplicateGroups.map((g) => (
                <DuplicateRow key={g.key} items={g.items} />
              ))}
            </ul>
          </ReviewGroup>

          <ReviewGroup
            title="Missing quantity"
            hint="Set how many copies are on hand. Tick several to set them together."
            count={buckets.missingQuantity.length}
            tone="var(--warn)"
          >
            <MissingQtyGroup items={buckets.missingQuantity} />
          </ReviewGroup>

          <ReviewGroup
            title="No shelf / location"
            hint="Items without a shelf. Add a shelf to any you want shelved; it's optional, so it's fine to leave some unshelved. Tick several to set them together."
            count={buckets.noLocation.length}
            tone="var(--warn)"
          >
            <NoLocationGroup items={buckets.noLocation} />
          </ReviewGroup>

          <ReviewGroup
            title="Marked “Needs review”"
            hint="Flagged by a person. Resolve the note, then mark cataloged, singly or in bulk."
            count={buckets.needsReview.length}
            tone="var(--danger)"
          >
            <NeedsReviewGroup items={buckets.needsReview} />
          </ReviewGroup>
        </div>
      )}
    </div>
  )
}

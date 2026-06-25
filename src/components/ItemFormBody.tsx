import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Category, Condition, Item, ItemDraft, MaterialType, Status } from '../types'
import {
  CATEGORIES,
  CONDITIONS,
  MATERIAL_TYPES,
  STATUSES,
  UNCATEGORIZED,
} from '../types'
import { useCatalog } from '../store/useCatalog'
import { CATEGORY_META } from '../data/categories'
import { getCategoryColor } from '../lib/categoryColor'
import { findSimilar } from '../lib/dedupe'
import { Chip, ChipGroup } from './chips'
import { QuantityStepper } from './QuantityStepper'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { useItemFormValidation } from '../hooks/useItemFormValidation'
import '../screens/ItemForm.css'

export interface ItemFormBodyProps {
  mode: 'add' | 'edit'
  existing?: Item
  onClose: () => void
}

interface FormState {
  title: string
  quantity: number
  category: Category
  materialType: MaterialType
  section: string
  shelf: string
  author: string
  isbn: string
  notes: string
  condition: Condition | undefined
  status: Status
}

function emptyForm(): FormState {
  return {
    title: '',
    quantity: 1,
    category: UNCATEGORIZED,
    materialType: CATEGORY_META[UNCATEGORIZED].defaultType,
    section: CATEGORY_META[UNCATEGORIZED].section,
    shelf: '',
    author: '',
    isbn: '',
    notes: '',
    condition: undefined,
    status: 'Cataloged',
  }
}

function toDraft(f: FormState): ItemDraft {
  const draft: ItemDraft = {
    title: f.title.trim(),
    quantity: f.quantity,
    category: f.category,
    materialType: f.materialType,
    location: { section: f.section.trim(), shelf: f.shelf.trim() },
    status: f.status,
  }
  const author = f.author.trim()
  if (author) draft.author = author
  const isbn = f.isbn.trim()
  if (isbn) draft.isbn = isbn
  const notes = f.notes.trim()
  if (notes) draft.notes = notes
  if (f.condition) draft.condition = f.condition
  return draft
}

export function ItemFormBody({ mode, existing, onClose }: ItemFormBodyProps): JSX.Element {
  const { items, addItem, updateItem, removeItem } = useCatalog()

  const editing = mode === 'edit'

  const titleRef = useRef<HTMLInputElement>(null)
  // Tracks whether the user has manually overridden the material type so we
  // don't clobber their choice when they tap a different category.
  // In edit mode the type is already "set", so a category tap shouldn't change it.
  const typeTouched = useRef(Boolean(existing))

  const [form, setForm] = useState<FormState>(() => {
    if (existing) {
      return {
        title: existing.title,
        quantity: existing.quantity,
        category: existing.category,
        materialType: existing.materialType,
        section: existing.location.section,
        shelf: existing.location.shelf,
        author: existing.author ?? '',
        isbn: existing.isbn ?? '',
        notes: existing.notes ?? '',
        condition: existing.condition,
        status: existing.status,
      }
    }
    return emptyForm()
  })

  const [showMore, setShowMore] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saved, setSaved] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Clear the "saved" toast timer on unmount so it can't setState after the
  // form closes (e.g. Save & close within the 1.6s window).
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const dup = useMemo(
    () => (form.title.trim() ? findSimilar(items, form.title, existing?.id) : undefined),
    [items, form.title, existing?.id],
  )

  // Distinct sections/shelves already in the catalog, so the inputs offer a
  // "type or pick a previous value" dropdown instead of free-typing every time.
  const { sectionOptions, shelfOptions } = useMemo(() => {
    const secs = new Set<string>()
    const shs = new Set<string>()
    for (const it of items) {
      const s = it.location.section?.trim()
      if (s) secs.add(s)
      const sh = it.location.shelf?.trim()
      if (sh) shs.add(sh)
    }
    const byAlnum = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })
    return { sectionOptions: [...secs].sort(byAlnum), shelfOptions: [...shs].sort(byAlnum) }
  }, [items])

  const { canSave } = useItemFormValidation({ title: form.title })

  function patch(p: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function pickCategory(cat: Category) {
    setForm((prev) => ({
      ...prev,
      category: cat,
      // Leave the section/room alone, since picking a category must not overwrite a
      // location the user already set. They choose the room from the dropdown.
      // Suggest material type only if the user hasn't manually chosen one.
      materialType: typeTouched.current
        ? prev.materialType
        : CATEGORY_META[cat].defaultType,
    }))
  }

  function pickType(t: MaterialType) {
    typeTouched.current = true
    patch({ materialType: t })
  }

  function flashSaved() {
    setSaved(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setSaved(false), 1600)
  }

  function handleSaveAndAdd() {
    if (!canSave) return
    addItem(toDraft(form))
    flashSaved()
    // Reset title + quantity, keep category / type / location sticky.
    setForm((prev) => ({ ...prev, title: '', quantity: 1 }))
    titleRef.current?.focus()
  }

  function handleSaveAndClose() {
    if (!canSave) return
    addItem(toDraft(form))
    onClose()
  }

  function handleSaveChanges() {
    if (!canSave || !existing) return
    updateItem(existing.id, toDraft(form))
    onClose()
  }

  function handleDelete() {
    if (!existing) return
    removeItem(existing.id)
    onClose()
  }

  return (
    <>
      {/* ---- BASICS ---- */}
      <div className="form-section">
        <p className="form-section-heading">Basics</p>

        {/* Title: the only required field */}
        <div className="form-field">
          <label className="field-label" htmlFor="f-title">
            Title
          </label>
          <input
            id="f-title"
            ref={titleRef}
            className="input"
            autoFocus
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="e.g. Lord of the Flies"
            autoComplete="off"
          />
          {dup && (
            <div className="form-duphint" role="status">
              <span className="form-duphint__icon" aria-hidden="true">
                ⚠
              </span>
              <span>
                Similar title exists: <strong>{dup.title}</strong>
                {dup.location.shelf ? ` (${dup.location.shelf})` : ''},{' '}
                <Link to={`/item/${dup.id}`}>open it</Link>
              </span>
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="form-field">
          <span className="field-label">Quantity</span>
          <QuantityStepper value={form.quantity} onChange={(n) => patch({ quantity: n })} />
        </div>

        {/* Category */}
        <div className="form-field">
          <span className="field-label">Category</span>
          <ChipGroup>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={form.category === cat}
                onClick={() => pickCategory(cat)}
                color={getCategoryColor(cat)}
              >
                {cat}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {/* Material type */}
        <div className="form-field">
          <span className="field-label">Material type</span>
          <ChipGroup>
            {MATERIAL_TYPES.map((t) => (
              <Chip key={t} selected={form.materialType === t} onClick={() => pickType(t)}>
                {t}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      </div>

      {/* ---- LOCATION ---- */}
      <div className="form-section">
        <p className="form-section-heading">Location</p>

        {/* Location */}
        <div className="form-field">
          <div className="form-loc">
            <div className="form-loc__section">
              <label className="form-sublabel" htmlFor="f-section">
                Room
              </label>
              <input
                id="f-section"
                className="input"
                list="f-section-options"
                value={form.section}
                onChange={(e) => patch({ section: e.target.value })}
                placeholder="Grade 9 area"
                autoComplete="off"
              />
              <datalist id="f-section-options">
                {sectionOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="form-loc__row">
              <div className="form-loc__shelf">
                <label className="form-sublabel" htmlFor="f-shelf">
                  Shelf
                </label>
                <input
                  id="f-shelf"
                  className="input"
                  list="f-shelf-options"
                  value={form.shelf}
                  onChange={(e) => patch({ shelf: e.target.value })}
                  placeholder="A1"
                  autoComplete="off"
                />
                <datalist id="f-shelf-options">
                  {shelfOptions.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <span className="form-field-hint muted">e.g., A1, B2</span>
              </div>
            </div>
            {!form.section.trim() && !form.shelf.trim() && (
              <span className="form-field-hint muted">
                Location is empty - optional, but recommended for shelf labels.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ---- DETAILS (collapsed by default) ---- */}
      <div className="form-section">
        <p className="form-section-heading">Details</p>

        {/* More details, collapsed by default */}
        <div className="form-field">
          <button
            type="button"
            className="form-collapse-toggle"
            onClick={() => setShowMore((v) => !v)}
            aria-expanded={showMore}
          >
          <span className="form-collapse-caret" aria-hidden="true">
            {showMore ? '▾' : '▸'}
          </span>
          More details <span className="muted">(optional)</span>
        </button>

        {showMore && (
          <div className="form-more">
            <div className="form-subfield">
              <label className="form-sublabel" htmlFor="f-author">
                Author
              </label>
              <input
                id="f-author"
                className="input"
                value={form.author}
                onChange={(e) => patch({ author: e.target.value })}
                placeholder="e.g. William Golding"
                autoComplete="off"
              />
            </div>

            <div className="form-subfield">
              <label className="form-sublabel" htmlFor="f-isbn">
                ISBN
              </label>
              <input
                id="f-isbn"
                className="input"
                value={form.isbn}
                onChange={(e) => patch({ isbn: e.target.value })}
                placeholder="978…"
                autoComplete="off"
                inputMode="numeric"
              />
              <span className="form-field-hint muted">
                Can't find this ISBN? No problem - just fill in the details above and we'll add it.
              </span>
            </div>

            <div className="form-subfield">
              <span className="form-sublabel">Condition</span>
              <ChipGroup>
                {CONDITIONS.map((c) => (
                  <Chip
                    key={c}
                    selected={form.condition === c}
                    onClick={() =>
                      patch({ condition: form.condition === c ? undefined : c })
                    }
                  >
                    {c}
                  </Chip>
                ))}
              </ChipGroup>
            </div>

            <div className="form-subfield">
              <label className="form-sublabel" htmlFor="f-notes">
                Notes
              </label>
              <textarea
                id="f-notes"
                className="input form-textarea"
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="e.g. class set, box torn"
                rows={3}
              />
            </div>

            <div className="form-subfield">
              <span className="form-sublabel">Status</span>
              <ChipGroup>
                {STATUSES.map((s) => (
                  <Chip
                    key={s}
                    selected={form.status === s}
                    onClick={() => patch({ status: s })}
                  >
                    {s}
                  </Chip>
                ))}
              </ChipGroup>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Actions */}
      <div className="form-actions">
        {saved && (
          <div className="form-toast" role="status" aria-live="polite">
            Saved ✓
          </div>
        )}

        {editing ? (
          <>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={handleSaveChanges}
              disabled={!canSave}
            >
              Save changes
            </button>
            {confirmDelete ? (
              <ConfirmDeleteDialog
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
              />
            ) : (
              <button
                type="button"
                className="btn btn--danger btn--block"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={handleSaveAndAdd}
              disabled={!canSave}
            >
              Save &amp; add another
            </button>
            <button
              type="button"
              className="btn btn--block"
              onClick={handleSaveAndClose}
              disabled={!canSave}
            >
              Save &amp; close
            </button>
          </>
        )}
      </div>
    </>
  )
}

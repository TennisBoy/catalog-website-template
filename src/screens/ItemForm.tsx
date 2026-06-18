import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  Category,
  Condition,
  ItemDraft,
  MaterialType,
  Status,
} from '../types'
import {
  CATEGORIES,
  CONDITIONS,
  MATERIAL_TYPES,
  STATUSES,
  UNCATEGORIZED,
} from '../types'
import { useCatalog } from '../store/useCatalog'
import { CATEGORY_META, categoryColor } from '../data/categories'
import { findSimilar } from '../lib/dedupe'
import { Chip, ChipGroup } from '../components/chips'
import { QuantityStepper } from '../components/QuantityStepper'
import './ItemForm.css'

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

export function ItemForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, getItem, addItem, updateItem, removeItem } = useCatalog()

  const editing = Boolean(id)
  const existing = id ? getItem(id) : undefined

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

  const dup = useMemo(
    () => (form.title.trim() ? findSimilar(items, form.title, id) : undefined),
    [items, form.title, id],
  )

  const canSave = form.title.trim().length > 0

  function patch(p: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...p }))
  }

  function pickCategory(cat: Category) {
    setForm((prev) => ({
      ...prev,
      category: cat,
      // Auto-fill section from the category's default area on every change.
      section: CATEGORY_META[cat].section,
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
    navigate('/catalog')
  }

  function handleSaveChanges() {
    if (!canSave || !id) return
    updateItem(id, toDraft(form))
    navigate('/catalog')
  }

  function handleDelete() {
    if (!id) return
    removeItem(id)
    navigate('/catalog')
  }

  // Edit mode but the id doesn't resolve to a real item.
  if (editing && !existing) {
    return (
      <div className="page">
        <div className="page__head">
          <h1>Item not found</h1>
        </div>
        <p className="muted form-notfound">
          That item no longer exists.{' '}
          <Link to="/catalog">Back to the catalog</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page__head form-head">
        <Link to="/catalog" className="btn btn--ghost form-close" aria-label="Close">
          ✕
        </Link>
        <h1>{editing ? 'Edit item' : 'Add item'}</h1>
      </div>

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
              color={categoryColor(cat)}
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

      {/* Location */}
      <div className="form-field">
        <span className="field-label">Location</span>
        <div className="form-loc">
          <div className="form-loc__section">
            <label className="form-sublabel" htmlFor="f-section">
              Section
            </label>
            <input
              id="f-section"
              className="input"
              value={form.section}
              onChange={(e) => patch({ section: e.target.value })}
              placeholder="Grade 9 area"
              autoComplete="off"
            />
          </div>
          <div className="form-loc__row">
            <div className="form-loc__shelf">
              <label className="form-sublabel" htmlFor="f-shelf">
                Shelf
              </label>
              <input
                id="f-shelf"
                className="input"
                value={form.shelf}
                onChange={(e) => patch({ shelf: e.target.value })}
                placeholder="A1"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </div>

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
              <div className="form-confirm">
                <span className="form-confirm__msg">Delete this item?</span>
                <div className="form-confirm__btns">
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={handleDelete}
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
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
    </div>
  )
}

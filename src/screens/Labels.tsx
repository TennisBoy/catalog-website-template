import { useMemo, useState } from 'react'
import type { Category } from '../types'
import { CATEGORIES } from '../types'
import { useCatalog } from '../store/useCatalog'
import { getCategoryColor } from '../lib/categoryColor'
import { EmptyState } from '../components/EmptyState'
import './Labels.css'

type LabelType = 'category' | 'shelf'
type LabelSize = 'large' | 'medium' | 'small'

// A single printable label, fully resolved from the user's selection.
interface LabelSpec {
  key: string
  category: Category
  shelf?: string
}

const LABEL_TYPES: { id: LabelType; label: string }[] = [
  { id: 'category', label: 'Category' },
  { id: 'shelf', label: 'Shelf' },
]

const SIZES: { id: LabelSize; label: string }[] = [
  { id: 'large', label: 'Large' },
  { id: 'medium', label: 'Medium' },
  { id: 'small', label: 'Small' },
]

export function Labels() {
  const { items } = useCatalog()

  const [labelType, setLabelType] = useState<LabelType>('category')
  const [size, setSize] = useState<LabelSize>('large')
  const [showBand, setShowBand] = useState(true)
  // One selection set per label type so toggling type doesn't lose choices.
  const [picked, setPicked] = useState<Record<LabelType, Set<string>>>({
    category: new Set<string>(),
    shelf: new Set<string>(),
  })

  // ---- Derive the real options present in the data, per label type. ----
  // Category: offer all CATEGORIES (so empty categories can still be labeled).
  const categoryOptions = useMemo(
    () => CATEGORIES.map((c) => ({ key: c, category: c as Category })),
    [],
  )

  const shelfOptions = useMemo(() => {
    const seen = new Map<string, { key: string; category: Category; shelf: string }>()
    for (const it of items) {
      const shelf = it.location.shelf?.trim()
      if (!shelf) continue
      const key = `${it.category}||${shelf}`
      if (!seen.has(key)) seen.set(key, { key, category: it.category, shelf })
    }
    return [...seen.values()].sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.shelf.localeCompare(b.shelf, undefined, { numeric: true }),
    )
  }, [items])

  // The option list for the currently-active type, normalized to a label-ish row.
  const options = useMemo(() => {
    if (labelType === 'category')
      return categoryOptions.map((o) => ({
        key: o.key,
        category: o.category,
        label: o.category.toUpperCase(),
        sub: undefined as string | undefined,
      }))
    return shelfOptions.map((o) => ({
      key: o.key,
      category: o.category,
      label: o.category.toUpperCase(),
      sub: `Shelf ${o.shelf}` as string | undefined,
    }))
  }, [labelType, categoryOptions, shelfOptions])

  const activePicked = picked[labelType]

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev[labelType])
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return { ...prev, [labelType]: next }
    })
  }

  function selectAll() {
    setPicked((prev) => ({ ...prev, [labelType]: new Set(options.map((o) => o.key)) }))
  }

  function selectNone() {
    setPicked((prev) => ({ ...prev, [labelType]: new Set<string>() }))
  }

  // ---- Resolve the selected keys into concrete label specs to render. ----
  const labels = useMemo<LabelSpec[]>(() => {
    if (labelType === 'category')
      return categoryOptions
        .filter((o) => activePicked.has(o.key))
        .map((o) => ({ key: o.key, category: o.category }))
    return shelfOptions
      .filter((o) => activePicked.has(o.key))
      .map((o) => ({ key: o.key, category: o.category, shelf: o.shelf }))
  }, [labelType, activePicked, categoryOptions, shelfOptions])

  const noItems = items.length === 0

  return (
    <div className="page">
      <header className="page__head lbl-head">
        <p className="eyebrow">English Department</p>
        <h1>Label Generator</h1>
        <p className="muted">Print shelf and category labels for the shelves.</p>
      </header>

      {/* ---- The on-screen builder (hidden when printing) ---- */}
      <section className="lbl-controls card" aria-label="Label builder">
        {/* Label type */}
        <div className="lbl-field">
          <span className="lbl-field__label">Label type</span>
          <div className="lbl-seg" role="group" aria-label="Label type">
            {LABEL_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={'lbl-seg__btn' + (labelType === t.id ? ' is-active' : '')}
                aria-pressed={labelType === t.id}
                onClick={() => setLabelType(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pick what to print */}
        <div className="lbl-field">
          <div className="lbl-field__row">
            <span className="lbl-field__label">Pick what to print</span>
            <div className="lbl-pickbtns">
              <button type="button" className="btn lbl-mini" onClick={selectAll}>
                Select all
              </button>
              <button type="button" className="btn lbl-mini" onClick={selectNone}>
                None
              </button>
            </div>
          </div>

          {options.length === 0 ? (
            <p className="muted lbl-noopts">
              No shelves found in your catalog yet. Add items with a shelf to label them.
            </p>
          ) : (
            <ul className="lbl-checklist">
              {options.map((o) => {
                const checked = activePicked.has(o.key)
                return (
                  <li key={o.key}>
                    <label className={'lbl-check' + (checked ? ' is-checked' : '')}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o.key)}
                      />
                      <span
                        className="lbl-check__swatch"
                        style={{ background: getCategoryColor(o.category) }}
                        aria-hidden
                      />
                      <span className="lbl-check__text">
                        <span className="lbl-check__name">{o.label}</span>
                        {o.sub && <span className="lbl-check__sub muted">{o.sub}</span>}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Size + color band */}
        <div className="lbl-field lbl-field--inline">
          <div>
            <span className="lbl-field__label">Size</span>
            <div className="lbl-seg" role="group" aria-label="Label size">
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={'lbl-seg__btn' + (size === s.id ? ' is-active' : '')}
                  aria-pressed={size === s.id}
                  onClick={() => setSize(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="lbl-toggle">
            <input
              type="checkbox"
              checked={showBand}
              onChange={(e) => setShowBand(e.target.checked)}
            />
            <span>Show category color band</span>
          </label>
        </div>

        <div className="lbl-actions">
          <button
            type="button"
            className="btn btn--primary lbl-print"
            onClick={() => window.print()}
            disabled={labels.length === 0}
          >
            🖨 Print labels
          </button>
          <span className="muted lbl-count">
            {labels.length} {labels.length === 1 ? 'label' : 'labels'} selected
          </span>
        </div>
      </section>

      {/* ---- Preview / print area ---- */}
      <h2 className="lbl-preview-h2">Preview</h2>
      {labels.length === 0 ? (
        <div className="lbl-preview-empty">
          <EmptyState
            icon="🏷️"
            title="Nothing selected yet"
            hint={
              noItems
                ? 'Tip: you can still print category labels for all 11 categories. Pick some above.'
                : 'Choose a label type and tick the items you want to print.'
            }
          />
        </div>
      ) : (
        <div className={`lbl-sheet lbl-sheet--${size}`} aria-label="Label preview and print sheet">
          {labels.map((l) => {
            const color = getCategoryColor(l.category)
            return (
              <article
                key={l.key}
                className={'lbl-label' + (showBand ? ' lbl-label--band' : '')}
                style={{ ['--lbl-accent' as string]: color }}
              >
                {showBand && <div className="lbl-label__band" aria-hidden />}
                <div className="lbl-label__body">
                  <span className="lbl-label__cat">{l.category.toUpperCase()}</span>
                  {l.shelf && <span className="lbl-label__line">Shelf {l.shelf}</span>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

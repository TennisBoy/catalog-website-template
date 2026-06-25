import { useRef, useState } from 'react'
import type { Category } from '../types'
import { CATEGORIES } from '../types'
import { useCatalog } from '../store/useCatalog'
import { csvToDrafts, downloadText } from '../store/csv'
import { titleCount, copyCount, dateStamp } from '../lib/format'
import { countsByCategory } from '../store/selectors'
import { getCategoryColor } from '../lib/categoryColor'
import { exportFull, exportByCategories, exportShelfList, categorySlug } from '../utils/export'
import './ExportPage.css'

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null

export function ExportPage() {
  const { items, importItems, readOnly } = useCatalog()
  const fileRef = useRef<HTMLInputElement>(null)
  // Which categories to include in the multi-category export (a subset).
  const [exportCats, setExportCats] = useState<Category[]>([])
  const [importMsg, setImportMsg] = useState<Msg>(null)

  const titles = titleCount(items)
  const copies = copyCount(items)
  const perCategory = countsByCategory(items, true)
  const titlesByCat = new Map(perCategory.map((c) => [c.category, c.titles]))
  const stamp = dateStamp()

  const downloadFull = () =>
    downloadText(`engdep-catalog-${dateStamp()}.csv`, exportFull(items))

  const toggleExportCat = (c: Category) =>
    setExportCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const downloadCategories = () => {
    if (exportCats.length === 0) return
    const name =
      exportCats.length === 1
        ? `engdep-${categorySlug(exportCats[0])}-${dateStamp()}.csv`
        : `engdep-${exportCats.length}-categories-${dateStamp()}.csv`
    downloadText(name, exportByCategories(items, exportCats))
  }

  const downloadShelfList = () =>
    downloadText(`engdep-shelf-list-${dateStamp()}.csv`, exportShelfList(items))

  const selectedCatSet = new Set(exportCats)
  const selectedTitles = items.filter((it) => selectedCatSet.has(it.category)).length

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    try {
      const text = await file.text()
      const result = csvToDrafts(text)
      if (result.drafts.length === 0) {
        setImportMsg({
          tone: 'err',
          text: `No items imported: ${result.skipped} row(s) skipped. Check the CSV has a "title" column.`,
        })
        return
      }
      importItems(result.drafts)
      setImportMsg({
        tone: 'ok',
        text: `Imported ${result.drafts.length} items (${result.flaggedCount} flagged for review, ${result.skipped} skipped).`,
      })
    } catch (err) {
      setImportMsg({
        tone: 'err',
        text: `Couldn't read that file. ${err instanceof Error ? err.message : 'Please try a valid CSV.'}`,
      })
    }
  }

  return (
    <div className="page">
      <header className="page__head exp-no-print">
        <p className="eyebrow">English Department</p>
        <h1>Export</h1>
        <p className="muted">Get the catalog out for department records: the workflow's final step.</p>
      </header>

      {/* ---- Four exports ---- */}
      <section className="exp-no-print" aria-label="Exports">
        <div className="exp-rows">
          {/* 1. Full catalog */}
          <div className="card exp-row exp-row--wide">
            <div className="exp-row__body">
              <span className="exp-row__title">Export Full catalog (CSV)</span>
              <span className="exp-row__desc muted">Every item, all columns.</span>
              <span className="exp-row__count">
                {titles.toLocaleString()} titles · {copies.toLocaleString()} copies
              </span>
            </div>
            <div className="exp-row__actions">
              <button type="button" className="btn btn--primary" onClick={downloadFull}>
                ⬇ Export
              </button>
            </div>
          </div>

          {/* 2. Chosen categories (a subset, not the whole catalog) */}
          <div className="card exp-row exp-row--wide">
            <div className="exp-row__body">
              <span className="exp-row__title">Export categories</span>
              <span className="exp-row__desc muted">Select one or more categories to export</span>
              <span className="exp-row__count">
                {exportCats.length === 0
                  ? 'None selected'
                  : `${exportCats.length} ${exportCats.length === 1 ? 'category' : 'categories'} · ${selectedTitles.toLocaleString()} titles selected`}
              </span>
            </div>
            <div className="exp-cats" role="group" aria-label="Categories to export">
              {CATEGORIES.map((c) => {
                const on = selectedCatSet.has(c)
                const n = titlesByCat.get(c) ?? 0
                const color = getCategoryColor(c)
                return (
                  <button
                    key={c}
                    type="button"
                    className={'exp-cat-chip' + (on ? ' exp-cat-chip--on' : '')}
                    style={on ? { borderColor: color, background: `color-mix(in srgb, ${color} 14%, var(--surface))` } : undefined}
                    onClick={() => toggleExportCat(c)}
                    aria-pressed={on}
                    disabled={n === 0}
                  >
                    <span className="exp-cat-dot" style={{ background: color }} aria-hidden />
                    {c}
                    <span className="exp-cat-chip__n muted">{n}</span>
                  </button>
                )
              })}
            </div>
            <div className="exp-row__actions">
              {exportCats.length > 0 && (
                <button type="button" className="btn" onClick={() => setExportCats([])}>
                  Clear
                </button>
              )}
              <button
                type="button"
                className="btn btn--primary"
                onClick={downloadCategories}
                disabled={exportCats.length === 0}
              >
                ⬇ Export
              </button>
            </div>
          </div>

          {/* 3. Shelf / location list */}
          <div className="card exp-row">
            <div className="exp-row__body">
              <span className="exp-row__title">Shelf / location list</span>
              <span className="exp-row__desc muted">
                Every shelf and its titles: the physical map.
              </span>
              <span className="exp-row__count">Grouped by category → shelf, with copy totals</span>
            </div>
            <div className="exp-row__actions">
              <button type="button" className="btn btn--primary" onClick={downloadShelfList}>
                ⬇ Export
              </button>
            </div>
          </div>

          {/* 4. Printable summary */}
          <div className="card exp-row exp-row--wide">
            <div className="exp-row__body">
              <span className="exp-row__title">Print full catalog</span>
            </div>
            <div className="exp-row__actions">
              <button type="button" className="btn btn--primary" onClick={() => window.print()}>
                🖨 Print
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---- The on-page (and printable) summary ---- */}
      <section className="card exp-summary section-gap" aria-label="Inventory summary">
        <div className="exp-summary__head">
          <span className="exp-summary__title">English Department: Inventory Summary</span>
          <span className="exp-summary__stamp">As of {stamp}</span>
        </div>

        <div className="exp-summary__totals">
          <div>
            <span className="exp-total__num">{titles.toLocaleString()}</span>
            <span className="exp-total__label">Titles</span>
          </div>
          <div>
            <span className="exp-total__num">{copies.toLocaleString()}</span>
            <span className="exp-total__label">Copies</span>
          </div>
          <div>
            <span className="exp-total__num">
              {perCategory.filter((c) => c.titles > 0).length.toLocaleString()}
            </span>
            <span className="exp-total__label">Categories in use</span>
          </div>
        </div>

        <table className="exp-table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="exp-num">Titles</th>
              <th className="exp-num">Copies</th>
            </tr>
          </thead>
          <tbody>
            {perCategory.map((c) => (
              <tr key={c.category}>
                <td>
                  <span className="exp-cat-cell">
                    <span
                      className="exp-cat-dot"
                      style={{ background: getCategoryColor(c.category) }}
                      aria-hidden
                    />
                    {c.category}
                  </span>
                </td>
                <td className="exp-num">{c.titles.toLocaleString()}</td>
                <td className="exp-num">{c.copies.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="exp-num">{titles.toLocaleString()}</td>
              <td className="exp-num">{copies.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* ---- Backup ---- */}
      <section className="exp-no-print section-gap" aria-label="Backup">
        <h2 className="exp-h2">Backup</h2>
        <p className="exp-section-note muted">
          Export a copy any time for your records or as a backup.
        </p>

        <div className="exp-rows">
          <div className="card exp-row">
            <div className="exp-row__body">
              <span className="exp-row__title">Export backup (CSV)</span>
              <span className="exp-row__desc muted">Save the full catalog as a file.</span>
              <span className="exp-row__count">
                {titles.toLocaleString()} titles · {copies.toLocaleString()} copies
              </span>
            </div>
            <div className="exp-row__actions">
              <button type="button" className="btn btn--primary" onClick={downloadFull}>
                ⬇ Export backup
              </button>
            </div>
          </div>

          {!readOnly && (
            <div className="card exp-row">
              <div className="exp-row__body">
                <span className="exp-row__title">Import from CSV</span>
                <span className="exp-row__desc muted">
                  Add items from a CSV; unknown categories go to Needs review.
                </span>
              </div>
              <div className="exp-row__actions">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onImportFile}
                  hidden
                />
                <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
                  ⬆ Choose CSV…
                </button>
              </div>
            </div>
          )}
        </div>

        {importMsg && (
          <div
            className={
              'exp-msg' +
              (importMsg.tone === 'ok'
                ? ' exp-msg--ok'
                : importMsg.tone === 'err'
                  ? ' exp-msg--err'
                  : '')
            }
            role="status"
          >
            {importMsg.text}
          </div>
        )}
      </section>
    </div>
  )
}

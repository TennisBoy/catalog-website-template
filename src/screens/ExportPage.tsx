import { useRef, useState } from 'react'
import type { Category } from '../types'
import { CATEGORIES } from '../types'
import { useCatalog } from '../store/useCatalog'
import { itemsToCsv, csvToDrafts, downloadText } from '../store/csv'
import { titleCount, copyCount, dateStamp } from '../lib/format'
import { countsByCategory, shelvesByCategory } from '../store/selectors'
import { categoryColor } from '../data/categories'
import './ExportPage.css'

/** Turn a category name into a filename-safe slug, e.g. "Grade 9" -> "grade-9". */
function categorySlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Build the readable "physical map": category -> shelf -> titles + copies. */
function shelfListCsv(items: ReturnType<typeof useCatalog>['items']): string {
  const { byCategory, unshelved } = shelvesByCategory(items)
  const esc = (v: string) => (/[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v)
  const rows: string[] = ['category,shelf,title,copies']
  for (const cat of byCategory) {
    for (const shelf of cat.shelves) {
      for (const it of shelf.items) {
        rows.push([cat.category, shelf.shelf, it.title, String(it.quantity)].map(esc).join(','))
      }
      rows.push([cat.category, shelf.shelf, 'SHELF TOTAL', String(shelf.copies)].map(esc).join(','))
    }
  }
  for (const it of unshelved) {
    rows.push([it.category, '(no shelf)', it.title, String(it.quantity)].map(esc).join(','))
  }
  return rows.join('\r\n')
}

type Msg = { tone: 'ok' | 'err' | 'info'; text: string } | null

export function ExportPage() {
  const { items, importItems, resetToSample, clearAll, readOnly } = useCatalog()
  const fileRef = useRef<HTMLInputElement>(null)
  const [exportCat, setExportCat] = useState<Category>(CATEGORIES[0])
  const [importMsg, setImportMsg] = useState<Msg>(null)

  const titles = titleCount(items)
  const copies = copyCount(items)
  const perCategory = countsByCategory(items, true)
  const stamp = dateStamp()

  const downloadFull = () =>
    downloadText(`engdep-catalog-${dateStamp()}.csv`, itemsToCsv(items))

  const downloadCategory = () => {
    const filtered = items.filter((it) => it.category === exportCat)
    downloadText(`engdep-${categorySlug(exportCat)}-${dateStamp()}.csv`, itemsToCsv(filtered))
  }

  const downloadShelfList = () =>
    downloadText(`engdep-shelf-list-${dateStamp()}.csv`, shelfListCsv(items))

  const catTitles = items.filter((it) => it.category === exportCat).length

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

  const onReset = () => {
    if (window.confirm('Replace the whole catalog with the built-in sample data? This cannot be undone.')) {
      resetToSample()
      setImportMsg({ tone: 'info', text: 'Catalog reset to sample data.' })
    }
  }

  const onClear = () => {
    if (window.confirm('Delete every item in the catalog? This cannot be undone.')) {
      clearAll()
      setImportMsg({ tone: 'info', text: 'Catalog cleared.' })
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
              <span className="exp-row__title">Full catalog (CSV)</span>
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

          {/* 2. One category */}
          <div className="card exp-row">
            <div className="exp-row__body">
              <span className="exp-row__title">Export one category</span>
              <span className="exp-row__desc muted">Only the titles in a chosen category.</span>
              <span className="exp-row__count">
                {catTitles.toLocaleString()} titles in {exportCat}
              </span>
            </div>
            <div className="exp-row__actions">
              <select
                className="exp-select"
                aria-label="Category to export"
                value={exportCat}
                onChange={(e) => setExportCat(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn--primary" onClick={downloadCategory}>
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
              <span className="exp-row__title">Printable inventory summary</span>
              <span className="exp-row__desc muted">
                Totals and per-category counts for the department binder.
              </span>
              <span className="exp-row__count">Opens your browser print dialog</span>
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
                      style={{ background: categoryColor(c.category) }}
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

      {/* ---- Danger zone (editors only) ---- */}
      {!readOnly && (
        <section className="exp-no-print section-gap" aria-label="Danger zone">
          <h2 className="exp-h2">Danger zone</h2>
          <div className="card exp-danger exp-row">
            <div className="exp-row__body">
              <span className="exp-row__title">Reset or clear the catalog</span>
              <span className="exp-row__desc muted">
                Export a backup first; these can't be undone.
              </span>
            </div>
            <div className="exp-danger__row">
              <button type="button" className="btn" onClick={onReset}>
                Reset to sample data
              </button>
              <button type="button" className="btn btn--danger" onClick={onClear}>
                Clear all
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

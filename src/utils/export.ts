/**
 * Pure CSV-builder functions for the Export page.
 *
 * Each function returns a CSV string (CRLF line endings, RFC 4180 quoting).
 * Call `downloadText` from `src/store/csv.ts` to trigger the file download.
 * No DOM access; all functions are safe to call in Node/test environments.
 */

import type { Category, Item } from '../types'
import { itemsToCsv } from '../store/csv'
import { shelvesByCategory } from '../store/selectors'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** CSV-escape a single cell value (RFC 4180). */
function esc(v: string): string {
  return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
}

/** Turn a category name into a filename-safe slug, e.g. "Grade 9" -> "grade-9". */
export function categorySlug(category: Category): string {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------------------------------------------------------------------------
// Exported builder functions
// ---------------------------------------------------------------------------

/**
 * Full catalog export: every item, all columns.
 * Delegates to `itemsToCsv` (same as the original `downloadFull` handler).
 */
export function exportFull(items: Item[]): string {
  return itemsToCsv(items)
}

/**
 * Single-category export: every item whose category matches `category`.
 * Delegates to `itemsToCsv` on the filtered list (same as `downloadCategory`).
 */
export function exportByCategory(items: Item[], category: Category): string {
  return itemsToCsv(items.filter((it) => it.category === category))
}

/**
 * Multi-category export: every item whose category is in `categories`.
 * For exporting a chosen subset of categories (not the whole catalog). An empty
 * selection yields a header-only CSV; duplicate categories are de-duplicated.
 */
export function exportByCategories(items: Item[], categories: Category[]): string {
  const selected = new Set(categories)
  return itemsToCsv(items.filter((it) => selected.has(it.category)))
}

/**
 * Shelf / location list: physical map of category -> shelf -> titles + copies.
 * Reproduces the `shelfListCsv` local function from ExportPage exactly.
 *
 * Columns: category, shelf, title, copies
 * Unshelved items (no shelf) appear at the end with "(no shelf)" as the shelf.
 * Each shelf section ends with a SHELF TOTAL row.
 */
export function exportShelfList(items: Item[]): string {
  const { byCategory, unshelved } = shelvesByCategory(items)
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


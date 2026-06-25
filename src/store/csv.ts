import type { Item, ItemDraft, Category, MaterialType, Condition, Status } from '../types'
import { CATEGORIES, MATERIAL_TYPES, CONDITIONS, STATUSES, UNCATEGORIZED } from '../types'

// Round-trip CSV columns. Import and export share this header order.
const COLUMNS = [
  'title',
  'quantity',
  'category',
  'materialType',
  'section',
  'shelf',
  'author',
  'isbn',
  'condition',
  'status',
  'notes',
  'updatedAt',
] as const

function escapeCell(value: string): string {
  if (/[",\n\r]/.test(value)) return '"' + value.replace(/"/g, '""') + '"'
  return value
}

export function itemsToCsv(items: Item[]): string {
  const rows = [COLUMNS.join(',')]
  for (const it of items) {
    const cells = [
      it.title,
      String(it.quantity),
      it.category,
      it.materialType,
      it.location.section,
      it.location.shelf,
      it.author ?? '',
      it.isbn ?? '',
      it.condition ?? '',
      it.status,
      it.notes ?? '',
      it.updatedAt,
    ]
    rows.push(cells.map((c) => escapeCell(c)).join(','))
  }
  return rows.join('\r\n')
}

/** Minimal RFC-4180-ish parser: handles quotes, escaped quotes, embedded commas/newlines. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"'
          i++
        } else inQuotes = false
      } else cell += ch
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      rows.push(row)
      row = []
    } else {
      cell += ch
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}

function coerceCategory(v: string): { category: Category; flagged: boolean } {
  const found = CATEGORIES.find((c) => c.toLowerCase() === v.trim().toLowerCase())
  return found ? { category: found, flagged: false } : { category: UNCATEGORIZED, flagged: true }
}

function coerceType(v: string): { materialType: MaterialType; flagged: boolean } {
  const found = MATERIAL_TYPES.find((t) => t.toLowerCase() === v.trim().toLowerCase())
  // A blank cell is fine (defaults to Other, not a typo); a non-blank no-match is flagged.
  return found
    ? { materialType: found, flagged: false }
    : { materialType: 'Other', flagged: v.trim() !== '' }
}

function coerceCondition(v: string): Condition | undefined {
  return CONDITIONS.find((c) => c.toLowerCase() === v.trim().toLowerCase())
}

function coerceStatus(v: string, fallbackFlagged: boolean): Status {
  const found = STATUSES.find((s) => s.toLowerCase() === v.trim().toLowerCase())
  if (found) return found
  return fallbackFlagged ? 'Needs review' : 'Cataloged'
}

export interface ImportResult {
  drafts: ItemDraft[]
  flaggedCount: number // rows whose category/type couldn't be matched
  skipped: number // rows with no title
}

/** Parse CSV text into item drafts. Unknown categories fall back to
 *  Uncategorized and the row is flagged Needs review. */
export function csvToDrafts(text: string): ImportResult {
  const rows = parseCsv(text)
  if (rows.length === 0) return { drafts: [], flaggedCount: 0, skipped: 0 }

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = (name: string) => header.indexOf(name.toLowerCase())
  const col = {
    title: idx('title'),
    quantity: idx('quantity'),
    category: idx('category'),
    materialType: idx('materialtype'),
    section: idx('section'),
    shelf: idx('shelf'),
    author: idx('author'),
    isbn: idx('isbn'),
    condition: idx('condition'),
    status: idx('status'),
    notes: idx('notes'),
  }

  const drafts: ItemDraft[] = []
  let flaggedCount = 0
  let skipped = 0
  const cellAt = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : '')

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const title = cellAt(r, col.title)
    if (!title) {
      skipped++
      continue
    }
    const { category, flagged: catFlagged } = coerceCategory(cellAt(r, col.category))
    const { materialType, flagged: typeFlagged } = coerceType(cellAt(r, col.materialType))
    // Quantity: blank defaults to 1; a non-numeric/negative value becomes 0 and
    // flags the row for review rather than silently importing a wrong count.
    const qtyCell = cellAt(r, col.quantity)
    let quantity = 1
    let qtyFlagged = false
    if (qtyCell !== '') {
      const n = Number(qtyCell)
      if (Number.isFinite(n) && n >= 0) quantity = Math.round(n)
      else {
        quantity = 0
        qtyFlagged = true
      }
    }
    const flagged = catFlagged || typeFlagged || qtyFlagged
    if (flagged) flaggedCount++
    drafts.push({
      title,
      quantity,
      category,
      materialType,
      location: {
        section: cellAt(r, col.section),
        shelf: cellAt(r, col.shelf),
      },
      author: cellAt(r, col.author) || undefined,
      isbn: cellAt(r, col.isbn) || undefined,
      condition: coerceCondition(cellAt(r, col.condition)),
      notes: cellAt(r, col.notes) || undefined,
      status: coerceStatus(cellAt(r, col.status), flagged),
    })
  }
  return { drafts, flaggedCount, skipped }
}

/** Parse CSV text into fully-formed read-only Items (for the published catalog
 *  source). Preserves updatedAt/createdAt when present; assigns stable row ids. */
export function csvToItems(text: string): Item[] {
  const { drafts } = csvToDrafts(text)
  const rows = parseCsv(text)
  const header = rows.length ? rows[0].map((h) => h.trim().toLowerCase()) : []
  const tsCol = header.indexOf('updatedat')
  const cellAt = (r: string[], i: number) => (i >= 0 && i < r.length ? r[i].trim() : '')

  // Map each draft back to its source data row (drafts skip title-less rows, so
  // walk the data rows in parallel, skipping the ones csvToDrafts dropped).
  const items: Item[] = []
  let di = 0
  for (let i = 1; i < rows.length && di < drafts.length; i++) {
    if (!cellAt(rows[i], header.indexOf('title'))) continue
    const raw = tsCol >= 0 ? cellAt(rows[i], tsCol) : ''
    const ts = raw && Number.isFinite(new Date(raw).getTime()) ? raw : new Date().toISOString()
    items.push({ ...drafts[di], id: `row-${i}`, createdAt: ts, updatedAt: ts })
    di++
  }
  return items
}

/** Trigger a client-side file download of text content. */
export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

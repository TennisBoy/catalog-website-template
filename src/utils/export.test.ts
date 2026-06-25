import { describe, it, expect } from 'vitest'
import type { Item } from '../types'
import { exportFull, exportByCategory, exportByCategories, exportShelfList } from './export'

// ---------------------------------------------------------------------------
// Fixture: three items across two categories and two shelves
// ---------------------------------------------------------------------------
const makeItem = (overrides: Partial<Item> & Pick<Item, 'id' | 'title'>): Item => ({
  quantity: 1,
  category: 'Grade 9',
  materialType: 'Book',
  location: { section: 'A', shelf: 'A1' },
  status: 'Cataloged',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

const ITEMS: Item[] = [
  makeItem({ id: '1', title: 'Of Mice and Men', category: 'Grade 9', quantity: 30, location: { section: 'A', shelf: 'A1' } }),
  makeItem({ id: '2', title: 'The Great Gatsby', category: 'Grade 11', quantity: 25, location: { section: 'B', shelf: 'B1' } }),
  makeItem({ id: '3', title: 'Hamlet', category: 'Grade 11', quantity: 28, location: { section: 'B', shelf: 'B1' } }),
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Split a CRLF CSV into rows (skips blank trailing lines). */
function splitRows(csv: string): string[] {
  return csv.split(/\r\n|\n/).filter((r) => r.length > 0)
}

// ---------------------------------------------------------------------------
// exportFull
// ---------------------------------------------------------------------------
describe('exportFull', () => {
  it('returns a non-empty header row', () => {
    const csv = exportFull(ITEMS)
    const [header] = splitRows(csv)
    expect(header.length).toBeGreaterThan(0)
    expect(header.toLowerCase()).toContain('title')
  })

  it('returns one data row per item', () => {
    const csv = exportFull(ITEMS)
    const rows = splitRows(csv)
    // rows[0] is the header; remaining rows are data
    expect(rows.length - 1).toBe(ITEMS.length)
  })

  it('includes all item titles in the output', () => {
    const csv = exportFull(ITEMS)
    for (const item of ITEMS) {
      expect(csv).toContain(item.title)
    }
  })
})

// ---------------------------------------------------------------------------
// exportByCategory
// ---------------------------------------------------------------------------
describe('exportByCategory', () => {
  it('returns a non-empty header row', () => {
    const csv = exportByCategory(ITEMS, 'Grade 11')
    const [header] = splitRows(csv)
    expect(header.length).toBeGreaterThan(0)
    expect(header.toLowerCase()).toContain('title')
  })

  it('returns only items in the specified category', () => {
    const csv = exportByCategory(ITEMS, 'Grade 11')
    const rows = splitRows(csv)
    // Grade 11 has 2 items; header is row[0]
    expect(rows.length - 1).toBe(2)
  })

  it('returns zero data rows for a category with no items', () => {
    const csv = exportByCategory(ITEMS, 'ESL')
    const rows = splitRows(csv)
    expect(rows.length - 1).toBe(0)
  })

  it('does not include items from other categories', () => {
    const csv = exportByCategory(ITEMS, 'Grade 9')
    expect(csv).toContain('Of Mice and Men')
    expect(csv).not.toContain('The Great Gatsby')
  })
})

// ---------------------------------------------------------------------------
// exportByCategories (multiple categories, not the whole catalog)
// ---------------------------------------------------------------------------
describe('exportByCategories', () => {
  it('includes items from every selected category', () => {
    const csv = exportByCategories(ITEMS, ['Grade 9', 'Grade 11'])
    const rows = splitRows(csv)
    expect(rows.length - 1).toBe(3) // all three items, across the two categories
    expect(csv).toContain('Of Mice and Men')
    expect(csv).toContain('The Great Gatsby')
    expect(csv).toContain('Hamlet')
  })

  it('excludes categories that were not selected', () => {
    const csv = exportByCategories(ITEMS, ['Grade 11'])
    expect(csv).toContain('The Great Gatsby')
    expect(csv).not.toContain('Of Mice and Men')
  })

  it('returns only the header when nothing is selected', () => {
    const csv = exportByCategories(ITEMS, [])
    expect(splitRows(csv).length - 1).toBe(0)
  })

  it('does not duplicate items when a category is listed twice', () => {
    const csv = exportByCategories(ITEMS, ['Grade 11', 'Grade 11'])
    expect(splitRows(csv).length - 1).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// exportShelfList
// ---------------------------------------------------------------------------
describe('exportShelfList', () => {
  it('returns a non-empty header row', () => {
    const csv = exportShelfList(ITEMS)
    const [header] = splitRows(csv)
    expect(header).toBe('category,shelf,title,copies')
  })

  it('includes a SHELF TOTAL row for each shelf', () => {
    const csv = exportShelfList(ITEMS)
    const rows = splitRows(csv)
    const totalRows = rows.filter((r) => r.includes('SHELF TOTAL'))
    // A1 (Grade 9) + B1 (Grade 11) = 2 shelves
    expect(totalRows.length).toBe(2)
  })

  it('includes all item titles in the output', () => {
    const csv = exportShelfList(ITEMS)
    for (const item of ITEMS) {
      expect(csv).toContain(item.title)
    }
  })

  it('places unshelved items at the end with (no shelf)', () => {
    const unshelvedItem = makeItem({ id: '99', title: 'Lost Book', category: 'Grade 9', location: { section: '', shelf: '' } })
    const csv = exportShelfList([...ITEMS, unshelvedItem])
    const rows = splitRows(csv)
    // The unshelved row should contain '(no shelf)'
    const unshelvedRow = rows.find((r) => r.includes('(no shelf)'))
    expect(unshelvedRow).toBeDefined()
    expect(unshelvedRow).toContain('Lost Book')
  })
})


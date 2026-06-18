import { describe, it, expect } from 'vitest'
import { draftToItem, appendItems, toDonePath } from './catalogWrite.mjs'
import { CATEGORIES as ENUM_CATEGORIES, MATERIAL_TYPES as ENUM_MATERIAL_TYPES } from './enums.mjs'
import { CATEGORIES as TS_CATEGORIES, MATERIAL_TYPES as TS_MATERIAL_TYPES } from '../../src/types'

const baseDraft = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  isbn: '9780743273565',
  category: 'Grade 11',
  materialType: 'Book',
  notes: 'Scribner · 2004 · trade pb',
  sourceImage: 'catalog-inbox/Grade 11/gatsby.jpg',
}

describe('draftToItem', () => {
  it('builds a Needs-review item with quantity 0 and empty location', () => {
    const it = draftToItem(baseDraft, { id: 'id1', ts: '2026-06-16T12:00:00.000Z' })
    expect(it).toMatchObject({
      id: 'id1',
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      category: 'Grade 11',
      materialType: 'Book',
      notes: 'Scribner · 2004 · trade pb',
      quantity: 0,
      status: 'Needs review',
      location: { section: '', shelf: '' },
      createdAt: '2026-06-16T12:00:00.000Z',
      updatedAt: '2026-06-16T12:00:00.000Z',
    })
    expect('condition' in it).toBe(false)
    expect('sourceImage' in it).toBe(false)
  })
  it('omits optional fields that are null or empty', () => {
    const it = draftToItem(
      { ...baseDraft, author: null, isbn: '', notes: null },
      { id: 'id2', ts: '2026-06-16T12:00:00.000Z' },
    )
    expect('author' in it).toBe(false)
    expect('isbn' in it).toBe(false)
    expect('notes' in it).toBe(false)
  })
})

describe('appendItems', () => {
  it('concatenates without mutating the original', () => {
    const a = [{ id: '1' }]
    const b = [{ id: '2' }]
    const out = appendItems(a, b)
    expect(out.map((x) => x.id)).toEqual(['1', '2'])
    expect(a).toHaveLength(1)
  })
})

describe('toDonePath', () => {
  it('inserts _done after the inbox root', () => {
    expect(toDonePath('catalog-inbox/Grade 11/gatsby.jpg')).toBe(
      'catalog-inbox/_done/Grade 11/gatsby.jpg',
    )
  })
})

describe('draftToItem: enum coercion', () => {
  it('passes through a valid canonical category and materialType unchanged', () => {
    const item = draftToItem(baseDraft, { id: 'id3', ts: '2026-06-17T00:00:00.000Z' })
    expect(item.category).toBe('Grade 11')
    expect(item.materialType).toBe('Book')
  })
  it('coerces an unknown category to "Other / Uncategorized"', () => {
    const draft = { ...baseDraft, category: 'Grade9', materialType: 'Book' }
    const item = draftToItem(draft, { id: 'id4', ts: '2026-06-17T00:00:00.000Z' })
    expect(item.category).toBe('Other / Uncategorized')
  })
  it('coerces an unknown materialType to "Other"', () => {
    const draft = { ...baseDraft, category: 'Grade 11', materialType: 'DVD' }
    const item = draftToItem(draft, { id: 'id5', ts: '2026-06-17T00:00:00.000Z' })
    expect(item.materialType).toBe('Other')
  })
})

describe('drift-guard: enums.mjs must mirror src/types.ts', () => {
  it('CATEGORIES arrays are identical', () => {
    expect(ENUM_CATEGORIES).toEqual([...TS_CATEGORIES])
  })
  it('MATERIAL_TYPES arrays are identical', () => {
    expect(ENUM_MATERIAL_TYPES).toEqual([...TS_MATERIAL_TYPES])
  })
})

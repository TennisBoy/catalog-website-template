import { describe, expect, it } from 'vitest'
import { rowToItem, draftToRow, patchToRow } from './supabase'
import type { ItemDraft } from '../types'

const draft: ItemDraft = {
  title: 'Hamlet',
  quantity: 20,
  category: 'Grade 12',
  materialType: 'Book',
  location: { section: 'Room 1', shelf: 'G2' },
  author: 'William Shakespeare',
  isbn: '9780743477123',
  notes: 'Folger',
  condition: 'Good',
  status: 'Cataloged',
}

describe('draftToRow', () => {
  it('maps app fields to snake_case columns', () => {
    const row = draftToRow(draft)
    expect(row.material_type).toBe('Book')
    expect(row.section).toBe('Room 1')
    expect(row.shelf).toBe('G2')
    expect(row.author).toBe('William Shakespeare')
    expect(typeof row.updated_at).toBe('string')
    // The DB owns id and created_at.
    expect(row).not.toHaveProperty('id')
    expect(row).not.toHaveProperty('materialType')
  })

  it('writes null for missing optional fields', () => {
    const row = draftToRow({ ...draft, author: undefined, isbn: undefined, notes: undefined, condition: undefined })
    expect(row.author).toBeNull()
    expect(row.isbn).toBeNull()
    expect(row.notes).toBeNull()
    expect(row.condition).toBeNull()
  })
})

describe('rowToItem', () => {
  it('maps a DB row back to an Item, including dismiss flags', () => {
    const item = rowToItem({
      id: 'abc', title: 'Hamlet', quantity: 20, category: 'Grade 12', material_type: 'Book',
      section: 'Room 1', shelf: 'G2', author: 'WS', isbn: '978', notes: null, condition: null,
      status: 'Cataloged', shelf_dismissed: true, dup_dismissed: null,
      created_at: 'c', updated_at: 'u',
    })
    expect(item.location).toEqual({ section: 'Room 1', shelf: 'G2' })
    expect(item.materialType).toBe('Book')
    expect(item.shelfDismissed).toBe(true)
    expect(item.dupDismissed).toBe(false)
    expect(item.notes).toBeUndefined()
  })

  it('coerces an out-of-enum category/status to safe defaults', () => {
    const item = rowToItem({
      id: 'x', title: 't', quantity: 1, category: 'Bogus', material_type: 'Widget',
      section: '', shelf: '', author: null, isbn: null, notes: null, condition: 'Mint',
      status: 'Whatever', created_at: 'c', updated_at: 'u',
    })
    expect(item.category).toBe('Other / Uncategorized')
    expect(item.materialType).toBe('Other')
    expect(item.status).toBe('Needs review')
    expect(item.condition).toBeUndefined()
  })
})

describe('patchToRow', () => {
  it('includes only provided fields (plus updated_at) and maps dupDismissed', () => {
    const row = patchToRow({ status: 'Cataloged', dupDismissed: true })
    expect(row.status).toBe('Cataloged')
    expect(row.dup_dismissed).toBe(true)
    expect(row).not.toHaveProperty('title')
    expect(typeof row.updated_at).toBe('string')
  })
})

import { describe, expect, it } from 'vitest'
import { csvToDrafts, itemsToCsv, csvToItems } from './csv'
import type { Item } from '../types'

describe('csvToDrafts quantity handling', () => {
  it('defaults a blank quantity to 1', () => {
    const csv = 'title,quantity\nRomeo and Juliet,'
    const { drafts } = csvToDrafts(csv)
    expect(drafts[0].quantity).toBe(1)
  })

  it('preserves an explicit zero quantity', () => {
    const csv = 'title,quantity\nOut of stock set,0'
    const { drafts } = csvToDrafts(csv)
    expect(drafts[0].quantity).toBe(0)
  })

  it('parses a normal positive quantity', () => {
    const csv = 'title,quantity\nClass set,30'
    const { drafts } = csvToDrafts(csv)
    expect(drafts[0].quantity).toBe(30)
  })

  it('rounds a fractional quantity to a whole number', () => {
    const csv = 'title,quantity\nWeird,2.7'
    const { drafts } = csvToDrafts(csv)
    expect(drafts[0].quantity).toBe(3)
  })

  it('flags a non-numeric quantity as 0 and Needs review', () => {
    const csv = 'title,quantity\nTypo,abc'
    const { drafts, flaggedCount } = csvToDrafts(csv)
    expect(drafts[0].quantity).toBe(0)
    expect(drafts[0].status).toBe('Needs review')
    expect(flaggedCount).toBe(1)
  })
})

describe('csvToDrafts material type handling', () => {
  it('flags an unknown material type and marks the row Needs review', () => {
    const csv = 'title,category,materialType\nThing,Grade 9,Boko'
    const { drafts, flaggedCount } = csvToDrafts(csv)
    expect(drafts[0].materialType).toBe('Other')
    expect(drafts[0].status).toBe('Needs review')
    expect(flaggedCount).toBe(1)
  })

  it('does not flag a valid material type', () => {
    const csv = 'title,category,materialType\nThing,Grade 9,Book'
    const { drafts, flaggedCount } = csvToDrafts(csv)
    expect(drafts[0].materialType).toBe('Book')
    expect(flaggedCount).toBe(0)
  })
})

function sampleItem(over: Partial<Item> = {}): Item {
  return {
    id: 'x', title: 'Macbeth', quantity: 30, category: 'Grade 11',
    materialType: 'Book', location: { section: 'Front', shelf: 'A1' },
    author: 'Shakespeare', isbn: '9780000000001', notes: 'class set',
    condition: 'Good', status: 'Cataloged',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

describe('CSV round-trip', () => {
  it('preserves core fields through export then import', () => {
    const items = [sampleItem(), sampleItem({ title: 'Comma, and "quote"', notes: 'line1\nline2' })]
    const back = csvToItems(itemsToCsv(items))
    expect(back).toHaveLength(2)
    expect(back[0].title).toBe('Macbeth')
    expect(back[0].quantity).toBe(30)
    expect(back[0].category).toBe('Grade 11')
    expect(back[0].location.shelf).toBe('A1')
    expect(back[1].title).toBe('Comma, and "quote"')
    expect(back[1].notes).toBe('line1\nline2')
  })

  it('drops rows with no title', () => {
    const csv = 'title,quantity\n,5\nReal,2'
    const { drafts, skipped } = csvToDrafts(csv)
    expect(drafts).toHaveLength(1)
    expect(skipped).toBe(1)
  })

  it('handles an unclosed trailing quote without throwing', () => {
    const csv = 'title,author\n"Book, Smith'
    expect(() => csvToDrafts(csv)).not.toThrow()
  })
})

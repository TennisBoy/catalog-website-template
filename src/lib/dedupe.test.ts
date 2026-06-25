import { describe, expect, it } from 'vitest'
import { normalizeTitle, editionKey, findDuplicateGroups, findSimilar } from './dedupe'
import type { Item } from '../types'

function mk(over: Partial<Item> = {}): Item {
  return {
    id: Math.random().toString(36), title: 'Romeo and Juliet', quantity: 1,
    category: 'Grade 9', materialType: 'Book', location: { section: '', shelf: '' },
    status: 'Cataloged', createdAt: '', updatedAt: '', ...over,
  }
}

describe('normalizeTitle', () => {
  it('lowercases, strips punctuation, drops a leading article', () => {
    expect(normalizeTitle('The Great Gatsby!')).toBe('great gatsby')
  })
})

describe('editionKey', () => {
  it('treats same ISBN as the same edition regardless of formatting', () => {
    expect(editionKey(mk({ isbn: '978-0-00-1' }))).toBe(editionKey(mk({ isbn: '9780001' })))
  })
  it('treats different ISBNs as different editions', () => {
    expect(editionKey(mk({ isbn: '111' }))).not.toBe(editionKey(mk({ isbn: '222' })))
  })
  it('treats ISBN-10 and its ISBN-13 equivalent as the same edition', () => {
    // 0-7704-2935-1 (Seal Books Oryx and Crake) == 978-0-7704-2935-5
    expect(editionKey(mk({ isbn: '0-7704-2935-1' }))).toBe(editionKey(mk({ isbn: '978-0-7704-2935-5' })))
  })
})

describe('findDuplicateGroups', () => {
  it('groups same-edition items and ignores singletons', () => {
    const groups = findDuplicateGroups([mk({ isbn: '111' }), mk({ isbn: '111' }), mk({ isbn: '999' })])
    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(2)
  })

  it('excludes items dismissed as not-a-duplicate ("Keep both")', () => {
    const groups = findDuplicateGroups([
      mk({ isbn: '111', dupDismissed: true }),
      mk({ isbn: '111', dupDismissed: true }),
    ])
    expect(groups).toHaveLength(0)
  })

  it('still groups the un-dismissed copies in an edition', () => {
    const groups = findDuplicateGroups([
      mk({ isbn: '111' }),
      mk({ isbn: '111' }),
      mk({ isbn: '111', dupDismissed: true }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].items).toHaveLength(2)
  })
})

describe('findSimilar', () => {
  it('finds a title match excluding the given id', () => {
    const a = mk({ id: 'a', title: 'Hamlet' })
    const found = findSimilar([a], 'hamlet', 'b')
    expect(found?.id).toBe('a')
  })
})

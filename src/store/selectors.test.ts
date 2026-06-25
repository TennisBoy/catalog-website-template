import { describe, expect, it } from 'vitest'
import { countsByCategory, reviewBuckets, attentionCount } from './selectors'
import type { Item } from '../types'

function it_(over: Partial<Item> = {}): Item {
  return {
    id: Math.random().toString(36), title: 'T', quantity: 1, category: 'Grade 9',
    materialType: 'Book', location: { section: '', shelf: 'A1' }, status: 'Cataloged',
    createdAt: '', updatedAt: '', ...over,
  }
}

describe('countsByCategory', () => {
  it('counts titles as rows and copies as summed quantity', () => {
    const items = [it_({ quantity: 30 }), it_({ quantity: 12 })]
    const [g9] = countsByCategory(items)
    expect(g9.category).toBe('Grade 9')
    expect(g9.titles).toBe(2)
    expect(g9.copies).toBe(42)
  })
})

describe('reviewBuckets', () => {
  it('buckets uncategorized, missing-quantity, no-shelf, needs-review', () => {
    const items = [
      it_({ category: 'Other / Uncategorized' }),
      it_({ quantity: 0 }),
      it_({ location: { section: '', shelf: '' } }),
      it_({ status: 'Needs review' }),
    ]
    const b = reviewBuckets(items)
    expect(b.uncategorized).toHaveLength(1)
    expect(b.missingQuantity).toHaveLength(1)
    expect(b.noLocation).toHaveLength(1)
    expect(b.needsReview).toHaveLength(1)
    expect(attentionCount(b)).toBeGreaterThanOrEqual(4)
  })

  it('does not list a shelf-dismissed item as missing a location', () => {
    const b = reviewBuckets([it_({ location: { section: '', shelf: '' }, shelfDismissed: true })])
    expect(b.noLocation).toHaveLength(0)
  })
})

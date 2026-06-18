import type { Item, Category } from '../types'
import { CATEGORIES, UNCATEGORIZED } from '../types'
import { findDuplicateGroups, type DuplicateGroup } from '../lib/dedupe'

export interface ReviewBuckets {
  uncategorized: Item[]
  missingQuantity: Item[]
  noLocation: Item[]
  needsReview: Item[]
  duplicateGroups: DuplicateGroup[]
}

/** The five Review/Cleanup groups, derived live from the catalog. */
export function reviewBuckets(items: Item[]): ReviewBuckets {
  return {
    uncategorized: items.filter((it) => it.category === UNCATEGORIZED),
    missingQuantity: items.filter((it) => !(it.quantity > 0)),
    // Items without a shelf. They stay listed so the head can optionally add a
    // shelf to any of them later; a shelf is never required (saving without one
    // is fine; the item simply remains here until a shelf is set).
    noLocation: items.filter((it) => it.location.shelf.trim() === ''),
    needsReview: items.filter((it) => it.status === 'Needs review'),
    duplicateGroups: findDuplicateGroups(items),
  }
}

/** Total number of cleanup to-dos (drives the nav badge). */
export function attentionCount(b: ReviewBuckets): number {
  return (
    b.uncategorized.length +
    b.missingQuantity.length +
    b.noLocation.length +
    b.needsReview.length +
    b.duplicateGroups.length
  )
}

export interface CategoryCount {
  category: Category
  titles: number
  copies: number
}

/** Per-category title & copy counts, in canonical order, non-empty by default. */
export function countsByCategory(items: Item[], includeEmpty = false): CategoryCount[] {
  return CATEGORIES.map((category) => {
    const inCat = items.filter((it) => it.category === category)
    return {
      category,
      titles: inCat.length,
      copies: inCat.reduce((s, it) => s + (it.quantity || 0), 0),
    }
  }).filter((c) => includeEmpty || c.titles > 0)
}

export interface ShelfBucket {
  category: Category
  shelf: string
  items: Item[]
  copies: number
  flagged: boolean // holds a misplaced or uncategorized item
}

/** Items grouped by category → shelf, for the Shelf View. Items with no shelf
 *  are returned separately as `unshelved`. */
export function shelvesByCategory(items: Item[]): {
  byCategory: { category: Category; shelves: ShelfBucket[]; copies: number }[]
  unshelved: Item[]
} {
  const unshelved = items.filter((it) => it.location.shelf.trim() === '')
  const shelved = items.filter((it) => it.location.shelf.trim() !== '')

  const byCategory = CATEGORIES.map((category) => {
    const inCat = shelved.filter((it) => it.category === category)
    const shelfMap = new Map<string, Item[]>()
    for (const it of inCat) {
      const key = it.location.shelf.trim()
      const arr = shelfMap.get(key)
      if (arr) arr.push(it)
      else shelfMap.set(key, [it])
    }
    const shelves: ShelfBucket[] = [...shelfMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([shelf, shelfItems]) => ({
        category,
        shelf,
        items: shelfItems,
        copies: shelfItems.reduce((s, it) => s + (it.quantity || 0), 0),
        flagged: shelfItems.some(
          (it) => it.status === 'Misplaced' || it.category === UNCATEGORIZED,
        ),
      }))
    return {
      category,
      shelves,
      copies: inCat.reduce((s, it) => s + (it.quantity || 0), 0),
    }
  }).filter((c) => c.shelves.length > 0)

  return { byCategory, unshelved }
}

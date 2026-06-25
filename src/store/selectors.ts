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
    // Items without a shelf, unless the head dismissed them as "no shelf needed".
    // They stay listed so a shelf can be added later; a shelf is never required.
    noLocation: items.filter((it) => it.location.shelf.trim() === '' && !it.shelfDismissed),
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

export interface RoomShelfBucket extends ShelfBucket {
  /** The room (section) this shelf belongs to; buckets are room-scoped here. */
  section: string
}

/** Sort rooms so "Room 1/2/3" lead in numeric order, then any other section
 *  name alphabetically. Keeps the physical rooms together and predictable. */
function roomCompare(a: string, b: string): number {
  const ra = a.match(/^room\s+(\d+)$/i)
  const rb = b.match(/^room\s+(\d+)$/i)
  if (ra && rb) return Number(ra[1]) - Number(rb[1])
  if (ra) return -1
  if (rb) return 1
  return a.localeCompare(b, undefined, { numeric: true })
}

/** Items grouped by room (section) → category → shelf, for the Shelf View.
 *  Scoping shelves to a room means the same shelf label (e.g. "B1") in two
 *  different rooms stays distinct instead of merging. Items with no shelf are
 *  returned separately as `unshelved`. */
export function shelvesByRoom(items: Item[]): {
  rooms: {
    section: string
    categories: { category: Category; shelves: RoomShelfBucket[]; copies: number }[]
    copies: number
  }[]
  unshelved: Item[]
} {
  const unshelved = items.filter((it) => it.location.shelf.trim() === '')
  const shelved = items.filter((it) => it.location.shelf.trim() !== '')

  const roomMap = new Map<string, Item[]>()
  for (const it of shelved) {
    const room = it.location.section.trim() || '(no room)'
    const arr = roomMap.get(room)
    if (arr) arr.push(it)
    else roomMap.set(room, [it])
  }

  const rooms = [...roomMap.keys()]
    .sort(roomCompare)
    .map((section) => {
      const inRoom = roomMap.get(section)!
      const categories = CATEGORIES.map((category) => {
        const inCat = inRoom.filter((it) => it.category === category)
        const shelfMap = new Map<string, Item[]>()
        for (const it of inCat) {
          const key = it.location.shelf.trim()
          const arr = shelfMap.get(key)
          if (arr) arr.push(it)
          else shelfMap.set(key, [it])
        }
        const shelves: RoomShelfBucket[] = [...shelfMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .map(([shelf, shelfItems]) => ({
            section,
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
      return {
        section,
        categories,
        copies: inRoom.reduce((s, it) => s + (it.quantity || 0), 0),
      }
    })

  return { rooms, unshelved }
}

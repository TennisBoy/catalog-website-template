import type { Item } from '../types'

/** Normalize a title for fuzzy comparison: lowercase, strip punctuation,
 *  collapse whitespace, drop a leading article. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface DuplicateGroup {
  key: string
  items: Item[]
}

/** Identity of a specific *edition*. Same ISBN = same edition; without an ISBN,
 *  fall back to title + author + notes (publisher/year). This mirrors the
 *  database's duplicate-prevention rule, so different editions of the same title
 *  (different ISBN/publisher) are NOT treated as duplicates. */
export function editionKey(item: Pick<Item, 'title' | 'author' | 'isbn' | 'notes'>): string {
  const isbn = (item.isbn ?? '').replace(/[^0-9xX]/g, '').toLowerCase()
  if (isbn) return 'isbn:' + isbn
  return (
    'meta:' +
    normalizeTitle(item.title) +
    '|' +
    normalizeTitle(item.author ?? '') +
    '|' +
    normalizeTitle(item.notes ?? '')
  )
}

/** Groups of items that are the SAME edition (size >= 2): true duplicates. */
export function findDuplicateGroups(items: Item[]): DuplicateGroup[] {
  const buckets = new Map<string, Item[]>()
  for (const it of items) {
    const key = editionKey(it)
    const arr = buckets.get(key)
    if (arr) arr.push(it)
    else buckets.set(key, [it])
  }
  return [...buckets.entries()]
    .filter(([, arr]) => arr.length > 1)
    .map(([key, arr]) => ({ key, items: arr }))
}

/** First existing item whose title closely matches `title`, excluding `excludeId`. */
export function findSimilar(items: Item[], title: string, excludeId?: string): Item | undefined {
  const key = normalizeTitle(title)
  if (!key) return undefined
  return items.find((it) => it.id !== excludeId && normalizeTitle(it.title) === key)
}

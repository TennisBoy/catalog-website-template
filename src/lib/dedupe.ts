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

/** Convert a 10-digit ISBN to its 13-digit form so the same book recorded once
 *  as ISBN-10 and once as ISBN-13 resolves to a single edition. */
function isbn10to13(isbn10: string): string {
  const core = '978' + isbn10.slice(0, 9)
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3)
  const check = (10 - (sum % 10)) % 10
  return core + String(check)
}

/** Normalize an ISBN to a canonical comparable form (digits only, ISBN-13). */
export function normalizeIsbn(raw: string): string {
  const s = raw.replace(/[^0-9xX]/g, '').toLowerCase()
  if (s.length === 10 && /^[0-9]{9}[0-9x]$/.test(s)) return isbn10to13(s)
  return s
}

/** Identity of a specific *edition*. Same ISBN = same edition; without an ISBN,
 *  fall back to title + author + notes (publisher/year). This mirrors the
 *  database's duplicate-prevention rule, so different editions of the same title
 *  (different ISBN/publisher) are NOT treated as duplicates. */
export function editionKey(item: Pick<Item, 'title' | 'author' | 'isbn' | 'notes'>): string {
  const isbn = normalizeIsbn(item.isbn ?? '')
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

/** Groups of items that are the SAME edition (size >= 2): true duplicates.
 *  Items dismissed as "not a duplicate" ("Keep both") are excluded, so the
 *  warning stays cleared once a human has decided the rows should both remain. */
export function findDuplicateGroups(items: Item[]): DuplicateGroup[] {
  const buckets = new Map<string, Item[]>()
  for (const it of items) {
    if (it.dupDismissed) continue
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

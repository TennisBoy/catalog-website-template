import type { Item } from '../types'

/** Shape-check a parsed value before trusting it as an Item. Guards the boot
 *  path against a corrupt localStorage cache or a malformed catalog.json, which
 *  would otherwise crash selectors on `it.location.shelf`. */
function isItem(x: unknown): x is Item {
  if (typeof x !== 'object' || x === null) return false
  const it = x as Record<string, unknown>
  return (
    typeof it.id === 'string' &&
    typeof it.title === 'string' &&
    typeof it.quantity === 'number' &&
    typeof it.category === 'string' &&
    typeof it.materialType === 'string' &&
    typeof it.status === 'string' &&
    typeof it.location === 'object' &&
    it.location !== null &&
    typeof (it.location as Record<string, unknown>).shelf === 'string' &&
    typeof (it.location as Record<string, unknown>).section === 'string'
  )
}

/** Keep only well-formed items from an untrusted array. */
function sanitizeItems(arr: unknown[]): Item[] {
  return arr.filter(isItem)
}

/** Stable 8-hex-char FNV-1a hash of a string. */
export function hashText(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export interface LocalSnapshot {
  items: Item[]
  fileHash: string
}

export type CatalogSource = 'file' | 'cache' | 'empty'

/** Parse a persisted snapshot; null if absent or malformed. */
export function parseSnapshot(raw: string | null): LocalSnapshot | null {
  if (!raw) return null
  try {
    const v = JSON.parse(raw)
    if (v && Array.isArray(v.items) && typeof v.fileHash === 'string') {
      return { items: sanitizeItems(v.items), fileHash: v.fileHash }
    }
  } catch {
    /* fall through */
  }
  return null
}

/**
 * Decide the catalog to show on boot in local mode.
 * - file fetch failed (null): use cache if present, else empty.
 * - file unchanged vs cache: keep cached items (preserves in-browser edits).
 * - file changed or no cache: re-seed from the file (skill additions surface).
 */
export function reconcileLocalCatalog(args: {
  fileText: string | null
  cached: LocalSnapshot | null
}): { items: Item[]; fileHash: string; source: CatalogSource } {
  const { fileText, cached } = args
  if (fileText == null) {
    if (cached) return { items: cached.items, fileHash: cached.fileHash, source: 'cache' }
    return { items: [], fileHash: '', source: 'empty' }
  }
  let fileItems: Item[] = []
  try {
    const parsed = JSON.parse(fileText)
    if (Array.isArray(parsed)) fileItems = sanitizeItems(parsed)
  } catch {
    /* malformed file → treat as empty */
  }
  const fileHash = hashText(fileText)
  if (cached && cached.fileHash === fileHash) {
    return { items: cached.items, fileHash, source: 'cache' }
  }
  return { items: fileItems, fileHash, source: 'file' }
}

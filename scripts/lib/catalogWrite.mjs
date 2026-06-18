// Pure helpers for the catalog writer script. No filesystem access here.
import { CATEGORIES, UNCATEGORIZED, MATERIAL_TYPES } from './enums.mjs'

/**
 * Build a catalog Item from an identified draft.
 * quantity is 0 and status is "Needs review": copies/location are filled by a human later.
 * Optional fields are omitted when null/empty so the JSON stays clean.
 * Unknown category/materialType values are coerced to the "Other" fallback (exact match only).
 */
export function draftToItem(draft, { id, ts }) {
  const category = CATEGORIES.includes(draft.category) ? draft.category : UNCATEGORIZED
  const materialType = MATERIAL_TYPES.includes(draft.materialType) ? draft.materialType : 'Other'
  const item = {
    id,
    title: draft.title,
    quantity: 0,
    category,
    materialType,
    location: { section: '', shelf: '' },
    status: 'Needs review',
    createdAt: ts,
    updatedAt: ts,
  }
  if (draft.author) item.author = draft.author
  if (draft.isbn) item.isbn = draft.isbn
  if (draft.notes) item.notes = draft.notes
  return item
}

/** Concat without mutation. No dedupe; re-runs are prevented by moving images to _done. */
export function appendItems(existing, items) {
  return [...existing, ...items]
}

/** "catalog-inbox/<rest>" -> "catalog-inbox/_done/<rest>" (POSIX separators). */
export function toDonePath(sourceImage) {
  const norm = sourceImage.replace(/\\/g, '/')
  const prefix = 'catalog-inbox/'
  if (!norm.startsWith(prefix)) return norm
  return prefix + '_done/' + norm.slice(prefix.length)
}

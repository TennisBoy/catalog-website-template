/**
 * getCategoryColor: single accessor for category accent colors.
 *
 * Delegates to the canonical CATEGORY_META map in src/data/categories.ts
 * so the color values live in exactly one place. Falls back to the
 * 'Other / Uncategorized' color for any unknown string.
 */
import type { Category } from '../types'
import { CATEGORY_META } from '../data/categories'

const FALLBACK_COLOR = CATEGORY_META['Other / Uncategorized'].color

export function getCategoryColor(category: Category | string): string {
  const meta = (CATEGORY_META as Record<string, { color: string }>)[category]
  return meta ? meta.color : FALLBACK_COLOR
}

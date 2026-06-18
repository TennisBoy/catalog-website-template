import type { Category, MaterialType } from '../types'
import { CATEGORIES } from '../types'

export interface CategoryMeta {
  /** Full accent color (text/border on badges, color band on labels). */
  color: string
  /** Short label for compact chips. */
  short: string
  /** Default physical section pre-filled when this category is chosen. */
  section: string
  /** Best-guess material type when this category is chosen. */
  defaultType: MaterialType
}

// The single source of truth for category color + defaults. Color is the
// through-line between the on-screen badge, the Shelf View header, and the
// printed shelf label.
export const CATEGORY_META: Record<Category, CategoryMeta> = {
  'Grade 9': { color: '#2563EB', short: 'G9', section: 'Grade 9 area', defaultType: 'Book' },
  'Grade 10': { color: '#0891B2', short: 'G10', section: 'Grade 10 area', defaultType: 'Book' },
  'Grade 11': { color: '#7C3AED', short: 'G11', section: 'Grade 11 area', defaultType: 'Book' },
  'Grade 12': { color: '#DB2777', short: 'G12', section: 'Grade 12 area', defaultType: 'Book' },
  ESL: { color: '#EA580C', short: 'ESL', section: 'ESL area', defaultType: 'ESL Material' },
  French: { color: '#0D9488', short: 'Fr', section: 'French area', defaultType: 'Book' },
  'Theory of Knowledge': { color: '#CA8A04', short: 'TOK', section: 'TOK area', defaultType: 'Book' },
  'Board Games': { color: '#16A34A', short: 'Games', section: 'Games area', defaultType: 'Board Game' },
  Films: { color: '#DC2626', short: 'Film', section: 'Media', defaultType: 'Film' },
  'Book Club': { color: '#A21CAF', short: 'Club', section: 'Book Club area', defaultType: 'Book' },
  'Other / Uncategorized': { color: '#64748B', short: 'Other', section: '', defaultType: 'Other' },
}

export const GRADE_CATEGORIES: Category[] = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']

export function categoryColor(category: Category): string {
  return CATEGORY_META[category].color
}

/** All categories, in canonical order. */
export const ALL_CATEGORIES = CATEGORIES

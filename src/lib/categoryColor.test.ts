import { describe, expect, it } from 'vitest'
import { getCategoryColor } from './categoryColor'
import { CATEGORIES } from '../types'
import { CATEGORY_META } from '../data/categories'

describe('getCategoryColor', () => {
  it('returns a non-empty string for every canonical category', () => {
    for (const cat of CATEGORIES) {
      const color = getCategoryColor(cat)
      expect(color, `${cat} should have a color`).toBeTruthy()
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })

  it('returns exactly the color stored in CATEGORY_META for each category', () => {
    for (const cat of CATEGORIES) {
      expect(getCategoryColor(cat)).toBe(CATEGORY_META[cat].color)
    }
  })

  it('returns the fallback (Other / Uncategorized) color for an unknown value', () => {
    const fallback = CATEGORY_META['Other / Uncategorized'].color
    expect(getCategoryColor('Unknown Category')).toBe(fallback)
    expect(getCategoryColor('')).toBe(fallback)
  })
})

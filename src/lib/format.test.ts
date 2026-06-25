import { describe, expect, it } from 'vitest'
import { relativeTime, titleCount, copyCount, dateStamp } from './format'
import type { Item } from '../types'

describe('dateStamp', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(dateStamp(new Date('2026-06-25T09:00:00Z'))).toBe('2026-06-25')
  })
})

describe('relativeTime', () => {
  it('returns "unknown" for an invalid date', () => {
    expect(relativeTime('not-a-date')).toBe('unknown')
  })

  it('returns "just now" for the current time', () => {
    const now = Date.parse('2026-06-19T12:00:00Z')
    expect(relativeTime('2026-06-19T12:00:00Z', now)).toBe('just now')
  })

  it('formats minutes ago', () => {
    const now = Date.parse('2026-06-19T12:10:00Z')
    expect(relativeTime('2026-06-19T12:00:00Z', now)).toBe('10m ago')
  })
})

const item = (q: number): Item => ({
  id: 'x', title: 't', quantity: q, category: 'Grade 9', materialType: 'Book',
  location: { section: '', shelf: '' }, status: 'Cataloged', createdAt: '', updatedAt: '',
})

describe('counts', () => {
  it('titleCount is the number of rows', () => {
    expect(titleCount([item(5), item(2)])).toBe(2)
  })
  it('copyCount sums quantities', () => {
    expect(copyCount([item(5), item(2)])).toBe(7)
  })
})

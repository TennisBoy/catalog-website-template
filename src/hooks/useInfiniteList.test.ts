import { describe, expect, it } from 'vitest'
import { clampCount, nextCount } from './useInfiniteList'

describe('clampCount', () => {
  it('never exceeds total', () => {
    expect(clampCount(100, 30, 60)).toBe(30)
  })
  it('never drops below one page when items exist', () => {
    expect(clampCount(0, 200, 60)).toBe(60)
  })
  it('returns total when total is below a page', () => {
    expect(clampCount(60, 12, 60)).toBe(12)
  })
  it('returns 0 for an empty list', () => {
    expect(clampCount(60, 0, 60)).toBe(0)
  })
})

describe('nextCount', () => {
  it('grows by one page, capped at total', () => {
    expect(nextCount(60, 200, 60)).toBe(120)
    expect(nextCount(180, 200, 60)).toBe(200)
  })
  it('stays at total when already showing everything', () => {
    expect(nextCount(200, 200, 60)).toBe(200)
  })
})

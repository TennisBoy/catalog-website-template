import { describe, expect, it } from 'vitest'
import { stripUndefined } from './useCatalog'

describe('stripUndefined', () => {
  it('removes keys whose value is undefined', () => {
    expect(stripUndefined({ a: 1, b: undefined, c: 'x' })).toEqual({ a: 1, c: 'x' })
  })

  it('keeps null and falsy-but-defined values', () => {
    expect(stripUndefined({ a: 0, b: '', c: null })).toEqual({ a: 0, b: '', c: null })
  })
})

import { describe, it, expect } from 'vitest'
import type { Item } from '../types'
import { hashText, parseSnapshot, reconcileLocalCatalog } from './localCatalog'

const item = (id: string, title: string): Item => ({
  id,
  title,
  quantity: 0,
  category: 'Grade 9',
  materialType: 'Book',
  location: { section: '', shelf: '' },
  status: 'Needs review',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

describe('hashText', () => {
  it('is stable and differs for different input', () => {
    expect(hashText('abc')).toBe(hashText('abc'))
    expect(hashText('abc')).not.toBe(hashText('abd'))
    expect(hashText('abc')).toMatch(/^[0-9a-f]{8}$/)
  })
})

describe('parseSnapshot', () => {
  it('returns null for null, garbage, or wrong shape', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot('not json')).toBeNull()
    expect(parseSnapshot('{"items":"x"}')).toBeNull()
  })
  it('parses a valid snapshot', () => {
    const snap = { items: [item('a', 'A')], fileHash: 'deadbeef' }
    expect(parseSnapshot(JSON.stringify(snap))).toEqual(snap)
  })
})

describe('reconcileLocalCatalog', () => {
  it('uses file items when there is no cache', () => {
    const fileText = JSON.stringify([item('a', 'A')])
    const r = reconcileLocalCatalog({ fileText, cached: null })
    expect(r.source).toBe('file')
    expect(r.items).toHaveLength(1)
    expect(r.fileHash).toBe(hashText(fileText))
  })
  it('keeps cached items when the file hash is unchanged (preserves in-browser edits)', () => {
    const fileText = JSON.stringify([item('a', 'A')])
    const cached = { items: [item('a', 'A-edited'), item('b', 'B')], fileHash: hashText(fileText) }
    const r = reconcileLocalCatalog({ fileText, cached })
    expect(r.source).toBe('cache')
    expect(r.items).toHaveLength(2)
    expect(r.items[0].title).toBe('A-edited')
    expect(r.fileHash).toBe(hashText(fileText))
  })
  it('treats a malformed file as empty items but still source "file"', () => {
    const r = reconcileLocalCatalog({ fileText: 'not json', cached: null })
    expect(r).toEqual({ items: [], fileHash: hashText('not json'), source: 'file' })
  })
  it('re-seeds from file when the file hash changed (skill added books)', () => {
    const oldText = JSON.stringify([item('a', 'A')])
    const newText = JSON.stringify([item('a', 'A'), item('c', 'C')])
    const cached = { items: [item('a', 'A')], fileHash: hashText(oldText) }
    const r = reconcileLocalCatalog({ fileText: newText, cached })
    expect(r.source).toBe('file')
    expect(r.items.map((i) => i.id)).toEqual(['a', 'c'])
  })
  it('falls back to cache when the file fetch failed (null)', () => {
    const cached = { items: [item('a', 'A')], fileHash: 'x' }
    const r = reconcileLocalCatalog({ fileText: null, cached })
    expect(r.source).toBe('cache')
    expect(r.items).toHaveLength(1)
    expect(r.fileHash).toBe('x')
  })
  it('is empty when no file and no cache', () => {
    const r = reconcileLocalCatalog({ fileText: null, cached: null })
    expect(r).toEqual({ items: [], fileHash: '', source: 'empty' })
  })
})

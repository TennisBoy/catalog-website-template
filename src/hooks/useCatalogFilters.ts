import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Category, Item, MaterialType } from '../types'
import { CATEGORIES, UNCATEGORIZED } from '../types'

function isCategory(value: string | null): value is Category {
  return value != null && (CATEGORIES as readonly string[]).includes(value)
}

export interface CatalogFiltersState {
  query: string
  setQuery: (q: string) => void
  category: Category | 'All'
  setCategory: (c: Category | 'All') => void
  materialType: MaterialType | 'All'
  setMaterialType: (m: MaterialType | 'All') => void
  shelf: string
  setShelf: (s: string) => void
  uncatOnly: boolean
  setUncatOnly: (v: boolean) => void
  shelves: string[]
  anyActive: boolean
  clear(): void
}

export interface UseCatalogFiltersReturn {
  filtered: Item[]
  filters: CatalogFiltersState
}

export function useCatalogFilters(items: Item[]): UseCatalogFiltersReturn {
  const [params, setParams] = useSearchParams()

  // Filter state, initialized from URL params on mount
  const [query, setQueryState] = useState(() => params.get('q') ?? '')
  const [category, setCategory] = useState<Category | 'All'>(() => {
    const cat = params.get('cat')
    return isCategory(cat) ? cat : 'All'
  })
  const [materialType, setMaterialType] = useState<MaterialType | 'All'>('All')
  const [shelf, setShelf] = useState<string>('All')
  const [uncatOnly, setUncatOnly] = useState(() => params.get('uncat') === '1')

  function setQuery(q: string) {
    setQueryState(q)
    // Reflect search text back into the URL (keeps it shareable)
    const next = new URLSearchParams(params)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }

  // Distinct shelves present in the catalog, for the Location filter.
  const shelves = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) {
      const s = it.location.shelf?.trim()
      if (s) set.add(s)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [items])

  const anyActive =
    query.trim() !== '' ||
    category !== 'All' ||
    materialType !== 'All' ||
    shelf !== 'All' ||
    uncatOnly

  function clear() {
    setQueryState('')
    setCategory('All')
    setMaterialType('All')
    setShelf('All')
    setUncatOnly(false)
    // Clear the URL params too (q, cat, uncat) so a shared filtered link resets.
    const next = new URLSearchParams(params)
    next.delete('q')
    next.delete('cat')
    next.delete('uncat')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      if (q) {
        const hay = `${it.title} ${it.author ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (uncatOnly && it.category !== UNCATEGORIZED) return false
      if (category !== 'All' && it.category !== category) return false
      if (materialType !== 'All' && it.materialType !== materialType) return false
      if (shelf !== 'All' && it.location.shelf !== shelf) return false
      return true
    })
  }, [items, query, category, materialType, shelf, uncatOnly])

  return {
    filtered,
    filters: {
      query,
      setQuery,
      category,
      setCategory,
      materialType,
      setMaterialType,
      shelf,
      setShelf,
      uncatOnly,
      setUncatOnly,
      shelves,
      anyActive,
      clear,
    },
  }
}

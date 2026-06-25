import { useMemo, useState } from 'react'
import type React from 'react'
import type { Item } from '../types'

export type SortKey = 'title' | 'quantity' | 'category' | 'shelf' | 'updatedAt'
export type SortDir = 'asc' | 'desc'

export interface UseCatalogSortReturn {
  sorted: Item[]
  sortKey: SortKey
  setSortKey: (k: SortKey) => void
  sortDir: SortDir
  setSortDir: React.Dispatch<React.SetStateAction<SortDir>>
}

export function useCatalogSort(items: Item[]): UseCatalogSortReturn {
  // Default to alphabetical by title so the catalog reads like a book list on
  // first load (the user can switch to any other column/direction).
  const [sortKey, setSortKey] = useState<SortKey>('title')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...items].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'quantity':
          cmp = a.quantity - b.quantity
          break
        case 'category':
          cmp = a.category.localeCompare(b.category)
          break
        case 'shelf':
          cmp = (a.location.shelf || '').localeCompare(b.location.shelf || '', undefined, {
            numeric: true,
          })
          break
        case 'updatedAt':
          cmp = a.updatedAt.localeCompare(b.updatedAt)
          break
      }
      return cmp * dir
    })
  }, [items, sortKey, sortDir])

  return { sorted, sortKey, setSortKey, sortDir, setSortDir }
}

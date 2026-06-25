import { useState } from 'react'

export interface SelectionState {
  /** The raw set of selected IDs. Use isSelected() or selectedIds for common access patterns. */
  selectedIds: Set<string>
  /** Number of currently selected items. */
  count: number
  /** Toggle a single ID in/out of the selection. */
  toggle(id: string): void
  /** Clear the entire selection. */
  clear(): void
  /** Add all given IDs to the selection. */
  selectAll(ids: string[]): void
  /** Check whether a given ID is selected. */
  isSelected(id: string): boolean
  /**
   * Toggle all the given IDs: if every one of them is already selected,
   * deselect them all; otherwise select them all.
   * This is the standard "select-all checkbox" behaviour used by both
   * Review groups and the Catalog screen.
   */
  toggleAll(ids: string[]): void
}

/**
 * Shared multi-select hook used by Review (per-group) and Catalog (full table).
 *
 * The hook owns only the raw Set<string> of selected IDs.  Callers are
 * responsible for computing derived values that depend on the visible item
 * list (e.g. `allSelected`, `someSelected`) using `isSelected` / `count`.
 */
export function useSelection(): SelectionState {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  function clear() {
    setSelected(new Set())
  }

  function selectAll(ids: string[]) {
    setSelected((s) => {
      const n = new Set(s)
      ids.forEach((id) => n.add(id))
      return n
    })
  }

  function isSelected(id: string): boolean {
    return selected.has(id)
  }

  function toggleAll(ids: string[]) {
    setSelected((s) => {
      const allIn = ids.length > 0 && ids.every((id) => s.has(id))
      const n = new Set(s)
      if (allIn) ids.forEach((id) => n.delete(id))
      else ids.forEach((id) => n.add(id))
      return n
    })
  }

  return {
    selectedIds: selected,
    count: selected.size,
    toggle,
    clear,
    selectAll,
    isSelected,
    toggleAll,
  }
}

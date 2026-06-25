import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_PAGE = 60

/** Clamp a desired visible count into [min(pageSize,total), total]; 0 when empty. */
export function clampCount(count: number, total: number, pageSize: number): number {
  if (total <= 0) return 0
  const floor = Math.min(pageSize, total)
  return Math.min(total, Math.max(floor, count))
}

/** Next visible count after a "load more", capped at total. */
export function nextCount(count: number, total: number, pageSize: number): number {
  return Math.min(total, count + pageSize)
}

/** Cheap content signature: length + both endpoints. Distinguishes a real list
 *  change (filter/sort/content) — which should reset paging — from a realtime
 *  refetch that returns the same rows in the same order, which should NOT reset
 *  (so the reader doesn't get snapped back to the top after a live update). */
export function listSignature<T>(items: T[]): string {
  const n = items.length
  if (n === 0) return '0'
  return `${n}|${JSON.stringify(items[0])}|${JSON.stringify(items[n - 1])}`
}

export function useInfiniteList<T>(items: T[], pageSize: number = DEFAULT_PAGE) {
  const total = items.length
  const [count, setCount] = useState(() => clampCount(pageSize, total, pageSize))

  // Reset to the first page only when the list's content/order actually changes,
  // not on every new array reference (a realtime refetch makes a fresh array of
  // the same rows — that must not reset scroll).
  const signature = listSignature(items)
  const prevSig = useRef(signature)
  useEffect(() => {
    if (prevSig.current === signature) return
    prevSig.current = signature
    // Sync scroll state to an external list change (filter/sort/search/content).
    setCount(clampCount(pageSize, total, pageSize))
  }, [signature, pageSize, total])

  const hasMore = count < total
  const observer = useRef<IntersectionObserver | null>(null)

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observer.current) observer.current.disconnect()
      if (!node) return
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => nextCount(c, total, pageSize))
        }
      })
      observer.current.observe(node)
    },
    [total, pageSize],
  )

  useEffect(() => () => observer.current?.disconnect(), [])

  return { visible: items.slice(0, count), hasMore, sentinelRef }
}

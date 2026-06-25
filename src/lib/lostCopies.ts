export interface LostRemoval {
  /** How many copies are actually removed (clamped to what's on hand). */
  remove: number
  /** The resulting quantity after removal. */
  next: number
}

/** Plan how many copies to mark lost: clamp a requested count to what's on hand
 *  (and to a non-negative whole number), and return the new quantity. A request
 *  of zero or less is a no-op. */
export function planLostRemoval(available: number, requested: number): LostRemoval {
  const have = Math.max(0, available)
  const remove = Math.min(Math.max(0, Math.round(requested) || 0), have)
  return { remove, next: have - remove }
}

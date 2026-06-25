import { describe, expect, it } from 'vitest'
import { planLostRemoval } from './lostCopies'

describe('planLostRemoval', () => {
  it('removes the requested number of copies', () => {
    expect(planLostRemoval(21, 3)).toEqual({ remove: 3, next: 18 })
  })

  it('never removes more than are on hand', () => {
    expect(planLostRemoval(21, 50)).toEqual({ remove: 21, next: 0 })
    expect(planLostRemoval(2, 5)).toEqual({ remove: 2, next: 0 })
  })

  it('removes nothing when none are left', () => {
    expect(planLostRemoval(0, 1)).toEqual({ remove: 0, next: 0 })
  })

  it('treats zero/negative requests as a no-op', () => {
    expect(planLostRemoval(5, 0)).toEqual({ remove: 0, next: 5 })
    expect(planLostRemoval(5, -3)).toEqual({ remove: 0, next: 5 })
  })

  it('rounds fractional requests', () => {
    expect(planLostRemoval(5, 2.7)).toEqual({ remove: 3, next: 2 })
  })
})

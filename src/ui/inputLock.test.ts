import { describe, expect, it } from 'vitest'
import { INPUT_LOCK_SAFETY_MS, shouldClearInputLock } from './inputLock'

describe('input lock safety', () => {
  it('does not clear a fresh lock', () => {
    expect(shouldClearInputLock(1000, 1500)).toBe(false)
  })

  it('force-clears if animations hang past the safety window', () => {
    expect(shouldClearInputLock(0, INPUT_LOCK_SAFETY_MS)).toBe(true)
    expect(shouldClearInputLock(null, 99_000)).toBe(false)
  })
})

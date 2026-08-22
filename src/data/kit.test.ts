import { describe, expect, it } from 'vitest'
import { kitDropCap, kitDropChance, rollKitDrop } from './kit'

describe('kit drops', () => {
  it('gets rarer as sector difficulty rises', () => {
    expect(kitDropChance(1, 2, 'M')).toBeGreaterThan(kitDropChance(3, 2, 'M'))
    expect(kitDropChance(3, 2, 'M')).toBeGreaterThan(kitDropChance(5, 2, 'M'))
    expect(kitDropCap(1)).toBeGreaterThan(kitDropCap(5))
  })

  it('skips tiny pops more often than big bursts', () => {
    expect(kitDropChance(1, 1, 'S')).toBeLessThan(kitDropChance(1, 4, 'L'))
  })

  it('stops after the sector cap', () => {
    const blocked = rollKitDrop(99, 5, 4, 'L', kitDropCap(5))
    expect(blocked.item).toBeNull()
  })

  it('can award a kit item on a lucky roll', () => {
    let found = false
    let rng = 7
    for (let i = 0; i < 80 && !found; i++) {
      const roll = rollKitDrop(rng, 1, 4, 'L', 0)
      rng = roll.rngState
      if (roll.item) found = true
    }
    expect(found).toBe(true)
  })
})

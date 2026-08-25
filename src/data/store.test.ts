import { describe, expect, it } from 'vitest'
import { STORE_CATALOG } from './store'

describe('store catalog', () => {
  it('ships space-themed risk items as data', () => {
    const ids = STORE_CATALOG.map((i) => i.id)
    expect(ids).toEqual(expect.arrayContaining([
      'orbit-time',
      'comet-tail-shield',
      'challenge-reroll',
      'nebula-skip',
      'stack-stripes',
      'life-pack',
      'solar-flare',
      'gravity-well',
      'star-shuffle',
      'freeze-orbit',
      'hammer',
      'color-splash',
      'skin-pulsar',
    ]))
    const skip = STORE_CATALOG.find((i) => i.id === 'nebula-skip')!
    expect(skip.minSector).toBeGreaterThanOrEqual(2)
    expect(skip.price).toBeGreaterThan(STORE_CATALOG.find((i) => i.id === 'hammer')!.price)
  })

  it('keeps unique ids and a deep catalog', () => {
    const ids = STORE_CATALOG.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(STORE_CATALOG.filter((i) => !i.hidden).length).toBeGreaterThanOrEqual(120)
    expect(STORE_CATALOG.filter((i) => i.kind === 'skin' && !i.hidden).length).toBeGreaterThanOrEqual(20)
  })
})

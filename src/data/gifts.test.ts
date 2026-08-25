import { describe, expect, it } from 'vitest'
import { dailyDeals, giftPayload, LIFE_MAX } from './gifts'
import { dailyLevel, hashDay, shareOrbitHref, utcDayKey } from './daily'
import { STORE_CATALOG } from './store'

describe('gifts and daily stall', () => {
  it('marks kit singles giftable and skips skins and skips', () => {
    const flare = STORE_CATALOG.find((i) => i.id === 'solar-flare')!
    const skip = STORE_CATALOG.find((i) => i.id === 'nebula-skip')!
    const skin = STORE_CATALOG.find((i) => i.kind === 'skin' && !i.hidden)!
    expect(giftPayload(flare)).toBe('solar-flare')
    expect(giftPayload(skip)).toBeNull()
    expect(giftPayload(skin)).toBeNull()
  })

  it('picks three daily deals', () => {
    expect(dailyDeals('2026-08-25')).toHaveLength(3)
    expect(dailyDeals('2026-08-25').map((i) => i.id)).toEqual(dailyDeals('2026-08-25').map((i) => i.id))
  })

  it('caps the pulse well at five', () => {
    expect(LIFE_MAX).toBe(5)
  })
})

describe('daily orbit', () => {
  it('is deterministic for a UTC day', () => {
    const a = dailyLevel('2026-08-25')
    const b = dailyLevel('2026-08-25')
    expect(a.seed).toBe(b.seed)
    expect(a.seed).toBe(hashDay('2026-08-25'))
    expect(utcDayKey(Date.parse('2026-08-25T12:00:00Z'))).toBe('2026-08-25')
  })

  it('builds a shareable daily seed link', () => {
    expect(shareOrbitHref(42, 'https://play.example')).toBe('https://play.example/play/daily?seed=42')
  })
})

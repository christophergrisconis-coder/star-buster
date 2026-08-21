import { describe, expect, it } from 'vitest'
import { LEVELS as CAMPAIGN_LEVELS, CAMPAIGN, SECTORS } from './index'
import { LEVELS as PLAY_LEVELS } from './levels'
import { UNIVERSE } from './universe'

describe('campaign', () => {
  it('contains exactly 250 levels', () => {
    expect(CAMPAIGN_LEVELS.length).toBe(250)
    expect(PLAY_LEVELS.length).toBe(250)
    expect(UNIVERSE.stages.flatMap((s) => s.levelIds).length).toBe(250)
    expect(new Set(PLAY_LEVELS.map((l) => l.id)).size).toBe(250)
  })

  it('nests sectors → systems → nebulas → stages', () => {
    expect(SECTORS).toHaveLength(5)
    expect(CAMPAIGN.systems.length).toBeGreaterThan(0)
    expect(UNIVERSE.systems.length).toBeGreaterThan(0)
    expect(UNIVERSE.nebulas.length).toBeGreaterThan(0)
    expect(UNIVERSE.stages.every((s) => s.levelIds.length > 0)).toBe(true)
  })

  it('escalates reward caps by sector', () => {
    const caps = UNIVERSE.sectors.map((s) => s.rewardCap)
    for (let i = 1; i < caps.length; i++) expect(caps[i]!).toBeGreaterThan(caps[i - 1]!)
  })
})

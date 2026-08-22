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

  it('gives later sectors less orbit time and more board pressure', () => {
    const avg = (sid: number, fn: (l: (typeof CAMPAIGN_LEVELS)[number]) => number) => {
      const ls = CAMPAIGN_LEVELS.filter((l) => l.sectorId === sid)
      return ls.reduce((n, l) => n + fn(l), 0) / ls.length
    }
    expect(avg(1, (l) => l.timeLimit)).toBeGreaterThan(avg(2, (l) => l.timeLimit))
    expect(avg(2, (l) => l.timeLimit)).toBeGreaterThan(avg(3, (l) => l.timeLimit))
    expect(avg(3, (l) => l.timeLimit)).toBeGreaterThan(avg(4, (l) => l.timeLimit))
    expect(avg(4, (l) => l.timeLimit)).toBeGreaterThan(avg(5, (l) => l.timeLimit))
    expect(avg(1, (l) => l.moves)).toBeGreaterThan(avg(5, (l) => l.moves))
    expect(avg(5, (l) => l.frosting.length + l.chocolate.length + l.locks.length)).toBeGreaterThan(
      avg(1, (l) => l.frosting.length + l.chocolate.length + l.locks.length),
    )
    expect(avg(1, (l) => l.colorCount)).toBeLessThanOrEqual(avg(5, (l) => l.colorCount))
  })

  it('changes layouts across nebulas instead of only IDs', () => {
    const a = CAMPAIGN_LEVELS.find((l) => l.sectorId === 3)!
    const b = CAMPAIGN_LEVELS.find((l) => l.sectorId === 3 && l.nebulaId !== a.nebulaId)!
    expect(a.frosting.join()).not.toBe(b.frosting.join())
  })
})

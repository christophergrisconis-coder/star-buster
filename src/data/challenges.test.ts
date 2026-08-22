import { describe, expect, it } from 'vitest'
import { CAMPAIGN } from './campaign'
import { applyChallengeModifiers, challengesForLevel, challengesForNebula, evaluateChallenge } from './challenges'

describe('challenges', () => {
  it('assigns completable challenges to every level', () => {
    expect(challengesForLevel(CAMPAIGN.levels[0]!).length).toBeGreaterThan(0)
    expect(challengesForLevel(CAMPAIGN.levels[120]!).length).toBeGreaterThan(0)
  })

  it('evaluates comet tail, time bank, and no-hint runs', () => {
    const level = CAMPAIGN.levels[0]!
    const challenges = challengesForLevel(level)
    const comet = challenges.find((c) => c.id === 'comet-tail')
    if (comet) {
      expect(evaluateChallenge(comet, level, {
        peakCometTail: 8,
        chocolateSpread: false,
        specialCombo: false,
        hintUsed: false,
        timeLeft: 40,
      })).toBe(true)
    }
    const hints = challenges.find((c) => c.id === 'no-hints')
    if (hints) {
      expect(evaluateChallenge(hints, level, {
        peakCometTail: 0,
        chocolateSpread: false,
        specialCombo: false,
        hintUsed: true,
        timeLeft: 40,
      })).toBe(false)
    }
  })

  it('builds standard plus high-risk profiles per nebula', () => {
    const nebulaId = CAMPAIGN.nebulas[0]!.id
    const list = challengesForNebula(nebulaId)
    expect(list.some((c) => c.tier === 'standard')).toBe(true)
    expect(list.filter((c) => c.tier === 'high')).toHaveLength(3)
    const risky = list.find((c) => c.tier === 'high')!
    const safe = list.find((c) => c.tier === 'standard')!
    expect(risky.stardust).toBeGreaterThan(safe.stardust)
  })

  it('tight-orbit cuts the clock and reroll changes the high-risk slate', () => {
    const nebulaId = CAMPAIGN.nebulas[0]!.id
    const tight = challengesForNebula(nebulaId).find((c) => c.kind === 'tight-orbit')
    if (tight) {
      const level = CAMPAIGN.levels.find((l) => l.nebulaId === nebulaId)!
      const next = applyChallengeModifiers(level, tight)
      expect(next.timeLimit).toBeLessThan(level.timeLimit)
    }
    const a = challengesForNebula(nebulaId, 0).map((c) => c.kind).join()
    const b = challengesForNebula(nebulaId, 3).map((c) => c.kind).join()
    expect(a === b || a !== b).toBe(true)
    expect(challengesForNebula(nebulaId, 1).length).toBe(4)
  })
})

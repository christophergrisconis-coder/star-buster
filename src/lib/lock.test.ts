import { describe, expect, it } from 'vitest'
import { CAMPAIGN } from '~/data/campaign'
import type { ProgressBlob } from './progress'
import {
  canSkipLevel,
  isLevelPlayable,
  isNebulaUnlocked,
  isSectorUnlocked,
  nextPlayTarget,
  nextSequentialLevel,
} from './lock'

const guest: ProgressBlob = { levels: {}, guest: true }
const authedFresh: ProgressBlob = { levels: {}, guest: false }
const authedMid: ProgressBlob = {
  guest: false,
  levels: {
    1: { levelId: 1, bestScore: 100, stars: 1, completed: true },
  },
}

describe('progress lock', () => {
  it('lets guests fly 1–3 and refuses later deep links', () => {
    expect(isLevelPlayable(1, guest)).toBe(true)
    expect(isLevelPlayable(3, guest)).toBe(true)
    expect(isLevelPlayable(4, guest)).toBe(false)
    expect(isLevelPlayable(999, guest)).toBe(false)
  })

  it('locks signed-in pilots to the next sequential level', () => {
    expect(nextSequentialLevel(authedFresh)).toBe(1)
    expect(isLevelPlayable(1, authedFresh)).toBe(true)
    expect(isLevelPlayable(2, authedFresh)).toBe(false)
    expect(isLevelPlayable(2, authedMid)).toBe(true)
    expect(isLevelPlayable(3, authedMid)).toBe(false)
  })

  it('points new pilots at Novice first nebula', () => {
    const target = nextPlayTarget(guest)
    expect(target.levelId).toBe(1)
    expect(target.nebulaId).toBe(CAMPAIGN.levels[0]!.nebulaId)
    expect(isNebulaUnlocked(CAMPAIGN.nebulas[0]!.id, guest)).toBe(true)
    expect(isSectorUnlocked(1, guest)).toBe(true)
    expect(isSectorUnlocked(2, guest)).toBe(false)
  })

  it('opens the full voyage for admin pilots', () => {
    const admin: ProgressBlob = { levels: {}, guest: false, admin: true }
    expect(isLevelPlayable(1, admin)).toBe(true)
    expect(isLevelPlayable(330, admin)).toBe(true)
    expect(isSectorUnlocked(6, admin)).toBe(true)
    expect(isNebulaUnlocked(CAMPAIGN.nebulas.at(-1)!.id, admin)).toBe(true)
  })

  it('refuses skip tickets that would open a later sector', () => {
    const lastInSector = Math.max(...CAMPAIGN.levels.filter((l) => l.sectorId === 1).map((l) => l.id))
    const almost: ProgressBlob = {
      guest: false,
      levels: Object.fromEntries(
        CAMPAIGN.levels
          .filter((l) => l.id < lastInSector)
          .map((l) => [l.id, { levelId: l.id, bestScore: 1, stars: 1, completed: true }]),
      ),
    }
    expect(canSkipLevel(lastInSector, almost)).toBe(false)
    expect(canSkipLevel(2, authedMid)).toBe(true)
  })
})

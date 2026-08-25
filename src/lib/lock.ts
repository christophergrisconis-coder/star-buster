import { CAMPAIGN, LEVEL_BY_ID, LEVELS } from '~/data/campaign'
import { guestUnlocked } from '~/data/levels'
import type { ProgressBlob } from './progress'

/** Next sequential campaign level a signed-in pilot may enter (1–250). */
export function nextSequentialLevel(progress: ProgressBlob): number {
  const completed = Object.values(progress.levels)
    .filter((l) => l.completed)
    .map((l) => l.levelId)
  const max = completed.length ? Math.max(...completed) : 0
  return Math.min(250, Math.max(1, max + 1))
}

export function isAuthedPilot(progress: ProgressBlob): boolean {
  return progress.guest === false
}

/** Guests may freely fly 1–3. Signed-in pilots follow the sequential 250-level lock. */
export function isLevelPlayable(levelId: number, progress: ProgressBlob): boolean {
  if (!Number.isFinite(levelId) || levelId < 1 || levelId > 250) return false
  if (progress.admin) return true
  if (!isAuthedPilot(progress)) return guestUnlocked(levelId)
  return levelId <= nextSequentialLevel(progress)
}

export function firstLevelOfNebula(nebulaId: string): number | null {
  const level = LEVELS.find((l) => l.nebulaId === nebulaId)
  return level?.id ?? null
}

export function firstLevelOfSystem(systemId: string): number | null {
  const level = LEVELS.find((l) => l.systemId === systemId)
  return level?.id ?? null
}

export function firstLevelOfSector(sectorId: number): number | null {
  const level = LEVELS.find((l) => l.sectorId === sectorId)
  return level?.id ?? null
}

export function nebulaLevelIds(nebulaId: string): number[] {
  return LEVELS.filter((l) => l.nebulaId === nebulaId).map((l) => l.id)
}

export function nebulaRequiredComplete(nebulaId: string, progress: ProgressBlob): boolean {
  const ids = nebulaLevelIds(nebulaId)
  if (!ids.length) return false
  return ids.every((id) => progress.levels[id]?.completed)
}

export function isNebulaUnlocked(nebulaId: string, progress: ProgressBlob): boolean {
  const first = firstLevelOfNebula(nebulaId)
  if (first == null) return false
  return isLevelPlayable(first, progress)
}

export function isSystemUnlocked(systemId: string, progress: ProgressBlob): boolean {
  const first = firstLevelOfSystem(systemId)
  if (first == null) return false
  return isLevelPlayable(first, progress)
}

export function isSectorUnlocked(sectorId: number, progress: ProgressBlob): boolean {
  const first = firstLevelOfSector(sectorId)
  if (first == null) return false
  return isLevelPlayable(first, progress)
}

export function nextPlayTarget(progress: ProgressBlob): { levelId: number; nebulaId: string } {
  if (!isAuthedPilot(progress)) {
    for (let id = 1; id <= 3; id++) {
      if (!progress.levels[id]?.completed) {
        const level = LEVEL_BY_ID[id] ?? LEVELS[0]!
        return { levelId: level.id, nebulaId: level.nebulaId }
      }
    }
    const lastGuest = LEVEL_BY_ID[3] ?? LEVELS[0]!
    return { levelId: lastGuest.id, nebulaId: lastGuest.nebulaId }
  }
  const levelId = nextSequentialLevel(progress)
  const level = LEVEL_BY_ID[levelId] ?? LEVELS[0]!
  return { levelId: level.id, nebulaId: level.nebulaId }
}

export function activeNebulaId(progress: ProgressBlob): string {
  return nextPlayTarget(progress).nebulaId
}

/** Skip stays inside an already-unlocked sector; never opens a locked sector. */
export function canSkipLevel(levelId: number, progress: ProgressBlob): boolean {
  if (progress.admin) return Number.isFinite(levelId) && levelId >= 1 && levelId <= 250
  if (!isLevelPlayable(levelId, progress)) return false
  const level = LEVEL_BY_ID[levelId]
  if (!level) return false
  if (!isSectorUnlocked(level.sectorId, progress)) return false
  const after = LEVEL_BY_ID[levelId + 1]
  if (!after) return true
  return after.sectorId === level.sectorId
}

export function campaignNebulaOrder(): string[] {
  return CAMPAIGN.nebulas.map((n) => n.id)
}

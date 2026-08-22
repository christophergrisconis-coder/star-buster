/** Sector pressure used by the campaign, play HUD, and engine timers. */

export const SECTOR_DIFFICULTY = {
  1: {
    timeLimit: 180,
    cometTailMs: 4800,
    colorCount: 5,
    minMoves: 22,
    frostingHp: 1,
  },
  2: {
    timeLimit: 140,
    cometTailMs: 4000,
    colorCount: 6,
    minMoves: 18,
    frostingHp: 1,
  },
  3: {
    timeLimit: 105,
    cometTailMs: 3300,
    colorCount: 6,
    minMoves: 15,
    frostingHp: 2,
  },
  4: {
    timeLimit: 80,
    cometTailMs: 2600,
    colorCount: 6,
    minMoves: 12,
    frostingHp: 2,
  },
  5: {
    timeLimit: 58,
    cometTailMs: 2100,
    colorCount: 6,
    minMoves: 10,
    frostingHp: 3,
  },
} as const

export type SectorId = keyof typeof SECTOR_DIFFICULTY

export function sectorDifficulty(sectorId: number) {
  const id = Math.min(5, Math.max(1, sectorId)) as SectorId
  return SECTOR_DIFFICULTY[id]
}

/** Tight mobile window to chain scoring moves. Novice is longest. */
export function cometTailDurationMs(sectorId: number): number {
  return sectorDifficulty(sectorId).cometTailMs
}

export function cometTailMultiplier(tail: number): number {
  return 1 + Math.max(0, tail) * 0.2
}

export function levelTimeLimit(sectorId: number, variance = 0): number {
  const base = sectorDifficulty(sectorId).timeLimit
  const wobble = Math.abs(variance) % (sectorId <= 2 ? 8 : sectorId === 3 ? 7 : sectorId === 4 ? 6 : 5)
  return Math.max(45, base - wobble)
}

export function frostingHpFor(sectorId: number, index: number): number {
  const base = sectorDifficulty(sectorId).frostingHp
  if (sectorId <= 1) return 1
  if (sectorId === 2) return 1 + (index % 2)
  if (sectorId === 3) return 2
  if (sectorId === 4) return 2 + (index % 2)
  return base
}

export function ingredientExits(sectorId: number): number[] {
  if (sectorId <= 1) return [0, 1, 2, 3, 4, 5, 6, 7]
  if (sectorId === 2) return [1, 2, 3, 4, 5, 6]
  if (sectorId === 3) return [1, 2, 5, 6]
  if (sectorId === 4) return [2, 3, 4, 5]
  return [3, 4]
}

export function cometTailBanner(tail: number): string | null {
  if (tail < 3) return null
  if (tail === 3) return `METEOR TRAIL x${tail}`
  if (tail === 4 || tail === 5) return `ION WAKE x${tail}`
  return `COMET TAIL x${tail}`
}

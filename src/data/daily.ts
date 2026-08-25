import { generateLevel } from './levels'
import type { LevelConfig } from '~/engine/types'

export const DAILY_LEVEL_ID = 901

export function utcDayKey(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10)
}

export function hashDay(day: string): number {
  let h = 2166136261
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function dailyLevel(day = utcDayKey(), seedOverride?: number): LevelConfig {
  const seed = seedOverride ?? hashDay(day)
  const templateId = 1 + (seed % 40)
  const base = generateLevel(templateId)
  return {
    ...base,
    id: DAILY_LEVEL_ID,
    seed,
    name: `Daily orbit · ${day}`,
    nebulaId: 'daily',
    systemId: 'daily',
    stageId: 'daily',
    moves: Math.max(18, base.moves - 2),
  }
}

export function shareOrbitHref(seed: number, origin = typeof window === 'undefined' ? '' : window.location.origin): string {
  return `${origin}/play/daily?seed=${seed}`
}

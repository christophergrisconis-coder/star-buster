import type { LevelConfig } from '~/engine/types'
import { generateLevel } from './levels'

export const WEEKLY_LEVEL_ID = 902

export type WeeklyModifier =
  | 'anti-gravity'
  | 'rainbow-cascade'
  | 'frozen-clock'
  | 'mirror-board'
  | 'turbo-bombs'
  | 'double-jelly'

export interface WeeklyChallenge {
  modifier: WeeklyModifier
  title: string
  blurb: string
  stardustPrize: number
  coinsPrize: number
}

const WEEKLY_POOL: WeeklyChallenge[] = [
  {
    modifier: 'anti-gravity',
    title: 'Anti-Gravity Week',
    blurb: 'Stars fall slower — cascades are rarer but bigger when they hit.',
    stardustPrize: 120,
    coinsPrize: 500,
  },
  {
    modifier: 'rainbow-cascade',
    title: 'Rainbow Cascade',
    blurb: 'Every 3rd cascade wave spawns a random color-bomb. Chaos reigns.',
    stardustPrize: 150,
    coinsPrize: 600,
  },
  {
    modifier: 'frozen-clock',
    title: 'Frozen Clock',
    blurb: 'No orbit timer — but you only get half the moves.',
    stardustPrize: 100,
    coinsPrize: 450,
  },
  {
    modifier: 'mirror-board',
    title: 'Mirror Board',
    blurb: 'The board is symmetric. Match one side, the other echoes.',
    stardustPrize: 130,
    coinsPrize: 550,
  },
  {
    modifier: 'turbo-bombs',
    title: 'Turbo Bombs',
    blurb: 'Star bombs start with half the fuse. Defuse fast or burn.',
    stardustPrize: 160,
    coinsPrize: 650,
  },
  {
    modifier: 'double-jelly',
    title: 'Double Jelly',
    blurb: 'All jelly tiles are double-layered. Dig deep.',
    stardustPrize: 140,
    coinsPrize: 580,
  },
]

function weekNumber(at = Date.now()): number {
  const epoch = new Date('2026-01-05T00:00:00Z').getTime()
  return Math.floor((at - epoch) / (7 * 24 * 60 * 60 * 1000))
}

export function weekKey(at = Date.now()): string {
  const d = new Date(at)
  const day = d.getUTCDay()
  const monday = new Date(d.getTime() - day * 86_400_000 + (day === 0 ? -6 : 1) * 86_400_000)
  return monday.toISOString().slice(0, 10)
}

function hashWeek(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function currentWeekly(at = Date.now()): WeeklyChallenge {
  const wn = weekNumber(at)
  return WEEKLY_POOL[wn % WEEKLY_POOL.length]!
}

export function weeklyLevel(at = Date.now()): LevelConfig {
  const key = weekKey(at)
  const seed = hashWeek(key)
  const templateId = 20 + (seed % 30)
  const base = generateLevel(templateId)
  const weekly = currentWeekly(at)

  let moves = base.moves
  let timeLimit = base.timeLimit
  const jelly = [...base.jelly]
  const bombs = base.bombs.map((b) => ({ ...b }))

  if (weekly.modifier === 'frozen-clock') {
    moves = Math.max(12, Math.floor(base.moves * 0.55))
    timeLimit = 9999
  }
  if (weekly.modifier === 'turbo-bombs') {
    for (const b of bombs) b.turns = Math.max(3, Math.floor(b.turns * 0.5))
  }
  if (weekly.modifier === 'double-jelly') {
    for (let i = 0; i < jelly.length; i++) {
      if (jelly[i]! > 0) jelly[i] = 2
    }
  }

  return {
    ...base,
    id: WEEKLY_LEVEL_ID,
    seed,
    name: `${weekly.title} · ${key}`,
    nebulaId: 'weekly',
    systemId: 'weekly',
    stageId: 'weekly',
    moves,
    timeLimit,
    jelly,
    bombs,
  }
}

export function weeklyEndsAt(at = Date.now()): number {
  const d = new Date(at)
  const day = d.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(d.getTime())
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)
  return nextMonday.getTime()
}

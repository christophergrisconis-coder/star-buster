import type { LevelConfig, Objective, StarColor } from '~/engine/types'
import { BOARD_HEIGHT, BOARD_SIZE, BOARD_WIDTH, STAR_COLORS as COLORS } from '~/engine/types'
import { ingredientExits, levelTimeLimit, sectorDifficulty } from './difficulty'
import { SECTORS, UNIVERSE } from './universe'

function hash(n: number): number {
  let x = (n + 1) * 2654435761
  x ^= x >>> 16
  x = Math.imul(x, 2246822519)
  x ^= x >>> 13
  return x >>> 0
}

function pickColor(seed: number, i: number): StarColor {
  return COLORS[(seed + i) % COLORS.length]!
}

function scatter(seed: number, count: number, avoid: Set<number> = new Set()): number[] {
  const out: number[] = []
  let s = seed
  let guard = 0
  while (out.length < count && guard++ < 400) {
    s = hash(s + out.length * 17)
    const i = s % BOARD_SIZE
    if (avoid.has(i)) continue
    avoid.add(i)
    out.push(i)
  }
  return out
}

function patternFrostingLevels(seed: number, count: number, pattern: number, avoid: Set<number>): number[] {
  const wanted: number[] = []
  const tryAdd = (i: number) => {
    if (i < 0 || i >= BOARD_SIZE || avoid.has(i) || wanted.includes(i)) return
    wanted.push(i)
  }
  if (pattern === 0) {
    const col = 1 + (seed % 3)
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) tryAdd(col + y * BOARD_WIDTH)
    for (let y = 2; y < BOARD_HEIGHT - 2; y++) tryAdd((col + 3) % BOARD_WIDTH + y * BOARD_WIDTH)
  } else if (pattern === 1) {
    for (let x = 1; x < BOARD_WIDTH - 1; x++) {
      tryAdd(x + BOARD_WIDTH)
      tryAdd(x + (BOARD_HEIGHT - 2) * BOARD_WIDTH)
    }
  } else if (pattern === 2) {
    for (let i = 0; i < BOARD_WIDTH; i++) tryAdd(i + i * BOARD_WIDTH)
  } else if (pattern === 3) {
    const ox = seed % 2 === 0 ? 0 : BOARD_WIDTH - 4
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) {
      for (let x = 0; x < 4; x++) if ((x + y) % 2 === 0) tryAdd(ox + x + y * BOARD_WIDTH)
    }
  }
  for (const i of wanted) avoid.add(i)
  if (wanted.length >= count) return wanted.slice(0, count)
  return [...wanted, ...scatter(seed + 41, count - wanted.length, avoid)]
}

function objectiveFor(id: number, sectorId: number, seed: number): {
  objective: Objective
  jelly: number[]
  ingredients: number[]
} {
  const roll = id % 10
  const jelly = Array.from({ length: BOARD_SIZE }, () => 0)
  if (roll < 4) {
    const layers = sectorId >= 3 ? 2 : 1
    const step = sectorId >= 4 ? 3 : 4
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (i % step !== 0) jelly[i] = i % 9 === 4 ? layers : Math.min(layers, 1)
    }
    const remaining = jelly.reduce((n, v) => n + v, 0)
    return { objective: { type: 'jelly', remaining }, jelly, ingredients: [] }
  }
  if (roll < 7) {
    const color = pickColor(id, 0)
    const count = 8 + sectorId * 4 + (id % 5)
    const orders =
      sectorId >= 3 && id % 3 === 0
        ? [
            { color, count },
            {
              special: 'wrapped' as const,
              count: 1 + (sectorId >= 4 ? 1 : 0),
            },
          ]
        : [{ color, count }]
    return { objective: { type: 'order', orders }, jelly, ingredients: [] }
  }
  const n = 1 + Math.floor(sectorId / 2)
  const ingredients = scatter(seed + 91, n)
  return { objective: { type: 'ingredient', remaining: n }, jelly, ingredients }
}

export function generateLevel(id: number): LevelConfig {
  const stage = UNIVERSE.stages.find((s) => s.levelIds.includes(id))
  if (!stage) throw new Error(`Level ${id} missing from universe`)
  const nebula = UNIVERSE.nebulas.find((n) => n.id === stage.nebulaId)!
  const system = UNIVERSE.systems.find((s) => s.id === nebula.systemId)!
  const sector = SECTORS.find((s) => s.id === system.sectorId)!
  const local = stage.levelIds.indexOf(id)
  const seed = hash(id * 997 + sector.id * 131)
  const nebulaIndex = UNIVERSE.nebulas.filter((n) => n.systemId === system.id).findIndex((n) => n.id === nebula.id)
  const systemIndex = UNIVERSE.systems.filter((s) => s.sectorId === sector.id).findIndex((s) => s.id === system.id)
  const diff = sectorDifficulty(sector.id)
  const pattern = (nebulaIndex + systemIndex + local) % 5

  const moves = Math.max(
    diff.minMoves,
    28 - sector.id * 4 - systemIndex - Math.floor(local / 2) + (id % 3),
  )
  const avoid = new Set<number>()
  const frostCount =
    sector.id === 1 ? (id > 8 ? 3 + nebulaIndex : 0) : 6 + sector.id * 3 + systemIndex + (id % 4)
  const frosting =
    sector.id === 1
      ? scatter(seed, frostCount, avoid)
      : patternFrostingLevels(seed, frostCount, pattern, avoid)
  const chocCount =
    sector.id >= 3 ? 2 + (id % 3) + (sector.id - 3) + nebulaIndex : sector.id === 2 && id % 5 === 0 ? 2 : 0
  const chocolate = scatter(seed + 9, chocCount, avoid)
  const swirlCount = sector.id >= 2 ? 1 + (id % 3) + Math.floor(systemIndex / 2) : 0
  const swirls = scatter(seed + 21, swirlCount, avoid)
  const lockCount = sector.id >= 2 ? (id % 4 === 0 ? 2 + sector.id - 1 : 1) : 0
  const locks = scatter(seed + 33, lockCount, avoid)
  const marmCount = sector.id >= 3 ? 2 + nebulaIndex : 0
  const marmalade = scatter(seed + 45, marmCount, avoid)
  const bombs =
    sector.id >= 4
      ? scatter(seed + 77, 1 + (id % 3 === 0 ? 1 : 0) + (sector.id >= 5 ? 1 : 0), avoid).map((index) => ({
          index,
          turns: Math.max(5, 13 - sector.id),
        }))
      : []

  const { objective, jelly, ingredients } = objectiveFor(id, sector.id, seed)
  ingredients.forEach((i) => avoid.add(i))

  return {
    id,
    seed,
    name: `${nebula.name} ${local + 1}`,
    sectorId: sector.id,
    systemId: system.id,
    nebulaId: nebula.id,
    stageId: stage.id,
    moves,
    colorCount: diff.colorCount,
    rewardCap: sector.rewardCap,
    objective,
    frosting,
    marmalade,
    locks,
    swirls,
    chocolate,
    bombs,
    jelly,
    ingredients,
    exits: ingredientExits(sector.id),
    timeLimit: levelTimeLimit(sector.id, id + local),
  }
}

export const LEVELS: LevelConfig[] = Array.from({ length: 330 }, (_, i) => generateLevel(i + 1))

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS[id - 1]
}

export function guestUnlocked(id: number): boolean {
  return id >= 1 && id <= 3
}

if (LEVELS.length !== 330) {
  throw new Error('Expected 330 levels')
}

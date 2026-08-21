import type { LevelConfig, Objective, StarColor } from '~/engine/types'
import { STAR_COLORS as COLORS } from '~/engine/types'
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
    const i = s % 64
    if (avoid.has(i)) continue
    avoid.add(i)
    out.push(i)
  }
  return out
}

function objectiveFor(id: number, sectorId: number, seed: number): {
  objective: Objective
  jelly: number[]
  ingredients: number[]
} {
  const roll = id % 10
  const jelly = Array.from({ length: 64 }, () => 0)
  if (roll < 4) {
    const layers = sectorId >= 4 ? 2 : 1
    for (let i = 0; i < 64; i++) {
      if (i % 9 !== 4) jelly[i] = layers
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
              special: (id % 2 === 0 ? 'striped-h' : 'wrapped') as const,
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

  const moves = Math.max(12, 28 - sector.id * 3 - Math.floor(local / 2) + (id % 3))
  const avoid = new Set<number>()
  const frostCount = sector.id === 1 ? (id > 8 ? 4 : 0) : 6 + sector.id * 3 + (id % 4)
  const frosting = scatter(seed, frostCount, avoid)
  const chocCount =
    sector.id >= 3 ? 2 + (id % 3) + (sector.id - 3) : sector.id === 2 && id % 5 === 0 ? 2 : 0
  const chocolate = scatter(seed + 9, chocCount, avoid)
  const swirlCount = sector.id >= 2 ? 1 + (id % 3) : 0
  const swirls = scatter(seed + 21, swirlCount, avoid)
  const lockCount = sector.id >= 2 ? (id % 4 === 0 ? 3 : 1) : 0
  const locks = scatter(seed + 33, lockCount, avoid)
  const marmCount = sector.id >= 3 ? 2 : 0
  const marmalade = scatter(seed + 45, marmCount, avoid)
  const bombs =
    sector.id >= 4 && id % 4 === 0
      ? [{ index: scatter(seed + 77, 1, avoid)[0] ?? 10, turns: Math.max(6, 14 - sector.id) }]
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
    colorCount: sector.colorCount,
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
    exits: [1, 2, 5, 6],
  }
}

export const LEVELS: LevelConfig[] = Array.from({ length: 250 }, (_, i) => generateLevel(i + 1))

export function getLevel(id: number): LevelConfig | undefined {
  return LEVELS[id - 1]
}

export function guestUnlocked(id: number): boolean {
  return id >= 1 && id <= 3
}

if (LEVELS.length !== 250) {
  throw new Error('Expected 250 levels')
}

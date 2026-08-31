import type { LevelConfig, Objective, StarColor } from '~/engine/types'
import { BOARD_HEIGHT, BOARD_SIZE, BOARD_WIDTH, STAR_COLORS } from '~/engine/types'
import {
  ingredientExits,
  levelTimeLimit,
  sectorDifficulty,
} from './difficulty'
import { SECTORS, TREE } from './sectors'

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function mulberry(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickIndices(rand: () => number, count: number, avoid = new Set<number>()): number[] {
  const out: number[] = []
  let guard = 0
  while (out.length < count && guard++ < 400) {
    const i = Math.floor(rand() * BOARD_SIZE)
    if (avoid.has(i)) continue
    avoid.add(i)
    out.push(i)
  }
  return out
}

/**
 * Jelly is a board objective, not a random garnish.  Choose the next cell from
 * the area furthest from the jelly already placed so the player reads a route
 * across the whole orbit instead of one accidental blue cluster.
 */
function spreadJellyIndices(rand: () => number, count: number, avoid: Set<number>): number[] {
  const out: number[] = []
  const target = Math.min(count, BOARD_SIZE * 2)
  while (out.length < target) {
    let best = -1
    let bestScore = -Infinity
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (avoid.has(i) || out.filter((index) => index === i).length >= 2) continue
      const x = i % BOARD_WIDTH
      const y = Math.floor(i / BOARD_WIDTH)
      const nearest = out.length
        ? Math.min(
            ...out.map((index) =>
              Math.abs(x - (index % BOARD_WIDTH)) + Math.abs(y - Math.floor(index / BOARD_WIDTH)),
            ),
          )
        : 5
      // Break ties gently but deterministically; the geometry stays dominant.
      const score = nearest * 100 + rand()
      if (score > bestScore) {
        best = i
        bestScore = score
      }
    }
    if (best < 0) break
    out.push(best)
  }
  return out
}

function makeObjective(rand: () => number, sectorId: number, id: number): Objective {
  if (id <= 10) {
    return { type: 'jelly', remaining: id <= 3 ? 8 : id <= 6 ? 10 : 12 }
  }
  const roll = id % 4
  if (roll === 0) {
    return { type: 'jelly', remaining: 12 + sectorId * 7 + Math.floor(rand() * 8) }
  }
  if (roll === 1) {
    return { type: 'ingredient', remaining: 2 + Math.floor(sectorId / 2) + (rand() > 0.45 ? 1 : 0) }
  }
  if (roll === 2) {
    return {
      type: 'order',
      orders: [
        { special: 'wrapped', count: 1 + Math.floor(sectorId / 2) },
        { special: 'striped-h', count: 1 + Math.floor(sectorId / 3) },
      ],
    }
  }
  const color = STAR_COLORS[Math.floor(rand() * Math.min(6, 4 + sectorId))] as StarColor
  return { type: 'order', orders: [{ color, count: 14 + sectorId * 6 }] }
}

/** Distinct geometries so later nebulas/systems are not the same scatter with new IDs. */
function patternFrosting(
  rand: () => number,
  count: number,
  pattern: number,
  avoid: Set<number>,
): number[] {
  const wanted: number[] = []
  const tryAdd = (i: number) => {
    if (i < 0 || i >= BOARD_SIZE || avoid.has(i) || wanted.includes(i)) return
    wanted.push(i)
  }
  const kind = pattern % 14
  const inner = BOARD_WIDTH - 2
  if (kind === 0) {
    const col = 1 + (Math.floor(rand() * 3) % 3)
    for (let y = 1; y < BOARD_HEIGHT - 1; y++) tryAdd(col + y * BOARD_WIDTH)
    for (let y = 2; y < BOARD_HEIGHT - 2; y++) tryAdd(col + 3 + y * BOARD_WIDTH)
  } else if (kind === 1) {
    for (let x = 1; x < inner; x++) {
      tryAdd(x + BOARD_WIDTH)
      tryAdd(x + (BOARD_HEIGHT - 2) * BOARD_WIDTH)
    }
    for (let y = 2; y < BOARD_HEIGHT - 2; y++) {
      tryAdd(1 + y * BOARD_WIDTH)
      tryAdd(inner - 1 + y * BOARD_WIDTH)
    }
  } else if (kind === 2) {
    for (let i = 0; i < BOARD_WIDTH; i++) tryAdd(i + i * BOARD_WIDTH)
    for (let i = 0; i < BOARD_WIDTH - 2; i++) tryAdd(i + 2 + i * BOARD_WIDTH)
  } else if (kind === 3) {
    const ox = rand() > 0.5 ? 0 : BOARD_WIDTH - 4
    const oy = rand() > 0.5 ? 0 : BOARD_HEIGHT - 4
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if ((x + y) % 2 === 0) tryAdd(ox + x + (oy + y) * BOARD_WIDTH)
      }
    }
  } else if (kind === 4) {
    for (let x = 2; x < BOARD_WIDTH - 2; x++) {
      for (let y = 2; y < BOARD_HEIGHT - 2; y++) tryAdd(x + y * BOARD_WIDTH)
    }
  } else if (kind === 5) {
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      tryAdd(y % 2 === 0 ? 2 + y * BOARD_WIDTH : BOARD_WIDTH - 4 + y * BOARD_WIDTH)
    }
  } else if (kind === 6) {
    const mid = Math.floor(BOARD_HEIGHT / 2)
    for (let x = 0; x < BOARD_WIDTH; x++) tryAdd(x + (mid - 1) * BOARD_WIDTH)
    for (let x = 0; x < BOARD_WIDTH; x++) tryAdd(x + mid * BOARD_WIDTH)
  } else if (kind === 7) {
    for (let i = 0; i < BOARD_WIDTH; i++) tryAdd(BOARD_WIDTH - 1 - i + i * BOARD_WIDTH)
    for (let x = 2; x < BOARD_WIDTH - 2; x++) tryAdd(x + (BOARD_HEIGHT - 1) * BOARD_WIDTH)
  } else if (kind === 8) {
    // Hourglass Nexus
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      const span = Math.abs(y - Math.floor(BOARD_HEIGHT / 2))
      tryAdd(span + y * BOARD_WIDTH)
      tryAdd(BOARD_WIDTH - 1 - span + y * BOARD_WIDTH)
    }
  } else if (kind === 9) {
    // Diamond Core
    const cx = Math.floor(BOARD_WIDTH / 2)
    const cy = Math.floor(BOARD_HEIGHT / 2)
    for (let r = 0; r <= 3; r++) {
      tryAdd(cx + r + (cy - (3 - r)) * BOARD_WIDTH)
      tryAdd(cx - r + (cy - (3 - r)) * BOARD_WIDTH)
      tryAdd(cx + r + (cy + (3 - r)) * BOARD_WIDTH)
      tryAdd(cx - r + (cy + (3 - r)) * BOARD_WIDTH)
    }
  } else if (kind === 10) {
    // Corner Fortresses
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        tryAdd(x + y * BOARD_WIDTH)
        tryAdd(BOARD_WIDTH - 1 - x + y * BOARD_WIDTH)
        tryAdd(x + (BOARD_HEIGHT - 1 - y) * BOARD_WIDTH)
        tryAdd(BOARD_WIDTH - 1 - x + (BOARD_HEIGHT - 1 - y) * BOARD_WIDTH)
      }
    }
  } else if (kind === 11) {
    // Checkerboard Matrix
    for (let y = 1; y < BOARD_HEIGHT - 1; y += 2) {
      for (let x = 1; x < BOARD_WIDTH - 1; x += 2) {
        tryAdd(x + y * BOARD_WIDTH)
      }
    }
  } else {
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (i % 3 === 0) tryAdd(i)
    }
  }
  for (const i of wanted) avoid.add(i)
  if (wanted.length >= count) return wanted.slice(0, count)
  return [...wanted, ...pickIndices(rand, count - wanted.length, avoid)]
}

export interface CampaignNode {
  sectors: typeof SECTORS
  systems: Array<{ id: string; sectorId: number; name: string; nebulaIds: string[] }>
  nebulas: Array<{ id: string; systemId: string; sectorId: number; name: string; stageIds: string[] }>
  stages: Array<{ id: string; nebulaId: string; name: string; levelIds: number[] }>
  levels: LevelConfig[]
}

export function generateCampaign(): CampaignNode {
  const systems: CampaignNode['systems'] = []
  const nebulas: CampaignNode['nebulas'] = []
  const stages: CampaignNode['stages'] = []
  const levels: LevelConfig[] = []
  let levelId = 1

  for (const sector of TREE) {
    const sectorMeta = SECTORS.find((s) => s.id === sector.id)!
    const diff = sectorDifficulty(sector.id)
    for (const [systemIndex, system] of sector.systems.entries()) {
      const systemId = `${sector.id}-${slug(system.name)}`
      const nebulaIds: string[] = []
      for (const [nebulaIndex, nebula] of system.nebulas.entries()) {
        const nebulaId = `${systemId}-${slug(nebula.name)}`
        nebulaIds.push(nebulaId)
        const stageIds: string[] = []
        nebula.stages.forEach((count, stageIndex) => {
          const stageId = `${nebulaId}-orb-${stageIndex + 1}`
          stageIds.push(stageId)
          const levelIds: number[] = []
          for (let n = 0; n < count; n++) {
            const id = levelId++
            const seed = (0x51a7b000 + id * 7919) | 0
            const rand = mulberry(seed)
            const colorCount = diff.colorCount
            const moves = Math.max(
              diff.minMoves,
              32 - sector.id * 4 - systemIndex * 2 - nebulaIndex - Math.floor(id / 55) + Math.floor(rand() * 3),
            )
            const avoid = new Set<number>()
            const pattern = (id + nebulaIndex * 3 + systemIndex + stageIndex) % 10
            const frostingCount =
              id <= 10
                ? 0
                : sector.id === 1
                  ? 3 + Math.floor((id - 11) / 2) + nebulaIndex + (n % 3)
                  : 6 + sector.id * 3 + systemIndex + nebulaIndex + Math.floor(rand() * (sector.id + 3)) + (n % 4)
            const frosting = patternFrosting(rand, frostingCount, pattern, avoid)
            const chocCount =
              id <= 10
                ? 0
                : sector.id >= 3
                  ? 2 + sector.id - 3 + systemIndex + Math.floor(rand() * sector.id) + (n % 2)
                  : sector.id === 2
                    ? 1 + nebulaIndex + (n % 2)
                    : id > 14
                      ? 1
                      : 0
            const chocolate = chocCount > 0 ? pickIndices(rand, chocCount, avoid) : []
            const swirlCount =
              id <= 10 ? 0 : sector.id >= 2 ? 1 + nebulaIndex + Math.floor(rand() * sector.id) + (n % 2) : id > 16 ? 1 : 0
            const swirls = pickIndices(rand, swirlCount, avoid)
            const lockCount =
              id <= 10 ? 0 : sector.id >= 2 ? 2 + Math.floor(sector.id / 2) + (n % 3) : id > 12 ? 1 + (n % 2) : 0
            const locks = pickIndices(rand, lockCount, avoid)
            const marmCount =
              id <= 10
                ? 0
                : sector.id >= 3
                  ? 3 + Math.floor(rand() * 3) + nebulaIndex + (n % 2)
                  : id > 12
                    ? 1 + (n % 2)
                    : 0
            const marmalade = pickIndices(rand, marmCount, avoid)
            const bombCount =
              id <= 10
                ? 0
                : sector.id >= 4
                  ? 1 + Math.floor(rand() * (sector.id - 2)) + nebulaIndex
                  : sector.id === 3 && n % 2 === 1
                    ? 1
                    : 0
            const bombs = pickIndices(rand, bombCount, avoid).map((index) => ({
              index,
              turns: Math.max(5, 12 - sector.id - systemIndex),
            }))
            const objective = makeObjective(rand, sector.id, id)
            const jelly = Array.from({ length: BOARD_SIZE }, () => 0)
            if (objective.type === 'jelly') {
              const maxLayer = sector.id >= 4 ? 2 : 1
              const usable = new Set([...avoid])
              const placement = spreadJellyIndices(rand, objective.remaining, usable)
              for (const i of placement) {
                if (jelly[i]! < maxLayer) jelly[i]! += 1
              }
            }
            const ingredients =
              objective.type === 'ingredient'
                ? pickIndices(rand, objective.remaining, new Set(frosting))
                : []

            const isBoss =
              systemIndex === sector.systems.length - 1 &&
              nebulaIndex === system.nebulas.length - 1 &&
              stageIndex === nebula.stages.length - 1 &&
              n === count - 1

            levels.push({
              id,
              seed,
              name: isBoss ? `${nebula.name} — BOSS` : `${nebula.name} ${stageIndex + 1}-${n + 1}`,
              sectorId: sector.id,
              systemId,
              nebulaId,
              stageId,
              moves: isBoss ? Math.max(diff.minMoves, moves + 4) : moves,
              colorCount,
              rewardCap: isBoss ? sectorMeta.rewardCap * 2 : sectorMeta.rewardCap,
              objective: isBoss && objective.type === 'jelly'
                ? { type: 'jelly', remaining: objective.remaining + sector.id * 6 }
                : objective,
              frosting: isBoss
                ? [...frosting, ...pickIndices(rand, 4 + sector.id * 2, new Set(frosting))]
                : frosting,
              marmalade: isBoss ? [...marmalade, ...pickIndices(rand, sector.id, new Set([...marmalade, ...frosting]))] : marmalade,
              locks,
              swirls,
              chocolate: isBoss ? [...chocolate, ...pickIndices(rand, 2 + sector.id, new Set([...chocolate, ...frosting]))] : chocolate,
              bombs: isBoss ? [...bombs, ...pickIndices(rand, Math.min(3, sector.id), new Set(bombs.map(b => b.index))).map(i => ({ index: i, turns: Math.max(5, 10 - sector.id) }))] : bombs,
              jelly: isBoss && objective.type === 'jelly' ? jelly.map(j => j > 0 ? Math.min(2, j + 1) : j) : jelly,
              ingredients,
              exits: ingredientExits(sector.id),
              timeLimit: isBoss ? Math.floor(levelTimeLimit(sector.id, id + n + nebulaIndex) * 0.8) : levelTimeLimit(sector.id, id + n + nebulaIndex),
              boss: isBoss || undefined,
            })
            levelIds.push(id)
          }
          stages.push({
            id: stageId,
            nebulaId,
            name: `Cluster ${stageIndex + 1}`,
            levelIds,
          })
        })
        nebulas.push({
          id: nebulaId,
          systemId,
          sectorId: sector.id,
          name: nebula.name,
          stageIds,
        })
      }
      systems.push({ id: systemId, sectorId: sector.id, name: system.name, nebulaIds })
    }
  }

  if (levels.length !== 330) {
    throw new Error(`Campaign must be 330 levels, got ${levels.length}`)
  }

  return { sectors: SECTORS, systems, nebulas, stages, levels }
}

export const CAMPAIGN = generateCampaign()
export const LEVELS = CAMPAIGN.levels
/** Highest campaign level id — the single source of truth for the campaign length. */
export const FINAL_LEVEL_ID = LEVELS.length
export const LEVEL_BY_ID: Record<number, LevelConfig> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
)

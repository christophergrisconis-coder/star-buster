import type { LevelConfig, Objective, StarColor } from '~/engine/types'
import { STAR_COLORS } from '~/engine/types'
import {
  ingredientExits,
  levelTimeLimit,
  sectorDifficulty,
} from './difficulty'
import { SECTORS } from './sectors'

type StageSpec = number[]

interface NebulaSpec {
  name: string
  stages: StageSpec
}

interface SystemSpec {
  name: string
  nebulas: NebulaSpec[]
}

interface SectorSpec {
  id: number
  systems: SystemSpec[]
}

const TREE: SectorSpec[] = [
  {
    id: 1,
    systems: [
      {
        name: 'Helios Drift',
        nebulas: [
          { name: 'Amber Veil', stages: [5, 5] },
          { name: 'Coral Drift', stages: [5, 5] },
        ],
      },
      {
        name: 'Lyra Wake',
        nebulas: [
          { name: 'Violet Mist', stages: [5, 5] },
          { name: 'Ion Shoal', stages: [5, 5] },
        ],
      },
    ],
  },
  {
    id: 2,
    systems: [
      {
        name: 'Kepler Ring',
        nebulas: [
          { name: 'Dust Choir', stages: [4, 4] },
          { name: 'Glass Halo', stages: [3, 4] },
        ],
      },
      {
        name: 'Vespera',
        nebulas: [
          { name: 'Crimson Arc', stages: [4, 4] },
          { name: 'Pale Corona', stages: [3, 4] },
        ],
      },
      {
        name: 'Astra Current',
        nebulas: [
          { name: 'Blue Fold', stages: [4, 4] },
          { name: 'Silent Wake', stages: [3, 4] },
        ],
      },
    ],
  },
  {
    id: 3,
    systems: [
      {
        name: 'Titan Well',
        nebulas: [
          { name: 'Iron Cloud', stages: [5, 4] },
          { name: 'Obsidian Drift', stages: [4, 4] },
        ],
      },
      {
        name: 'Nyx Anchor',
        nebulas: [
          { name: 'Frost Spire', stages: [5, 4] },
          { name: 'Rift Choir', stages: [4, 4] },
        ],
      },
      {
        name: 'Hydra Bend',
        nebulas: [
          { name: 'Storm Shelf', stages: [4, 4] },
          { name: 'Echo Basin', stages: [4, 4] },
        ],
      },
    ],
  },
  {
    id: 4,
    systems: [
      {
        name: 'Phoenix Forge',
        nebulas: [
          { name: 'Solar Anvil', stages: [5, 5] },
          { name: 'Ember Lattice', stages: [5, 4] },
        ],
      },
      {
        name: 'Quasar Spine',
        nebulas: [
          { name: 'Pulse Canyon', stages: [5, 5] },
          { name: 'Photon Reef', stages: [5, 4] },
        ],
      },
      {
        name: 'Helix Crown',
        nebulas: [
          { name: 'Crown Flare', stages: [5, 4] },
          { name: 'Apex Dust', stages: [4, 4] },
        ],
      },
    ],
  },
  {
    id: 5,
    systems: [
      {
        name: 'Singularity',
        nebulas: [
          { name: 'Accretion Veil', stages: [5, 5] },
          { name: 'Photon Sphere', stages: [5, 5] },
        ],
      },
      {
        name: 'Abyss Meridian',
        nebulas: [
          { name: 'Dark Shear', stages: [5, 5] },
          { name: 'Null Wake', stages: [5, 5] },
        ],
      },
      {
        name: 'Omega Gate',
        nebulas: [
          { name: 'Last Light', stages: [5, 5] },
          { name: 'Horizon Heart', stages: [5, 5] },
        ],
      },
    ],
  },
]

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
    const i = Math.floor(rand() * 64)
    if (avoid.has(i)) continue
    avoid.add(i)
    out.push(i)
  }
  return out
}

function makeObjective(rand: () => number, sectorId: number, id: number): Objective {
  const roll = id % 3
  if (roll === 0) {
    return { type: 'jelly', remaining: 16 + sectorId * 10 + Math.floor(rand() * 10) }
  }
  if (roll === 1) {
    return { type: 'ingredient', remaining: 2 + Math.floor(sectorId / 2) + (rand() > 0.45 ? 1 : 0) }
  }
  const color = STAR_COLORS[Math.floor(rand() * Math.min(6, 4 + sectorId))] as StarColor
  if (rand() > 0.55) {
    return {
      type: 'order',
      orders: [{ special: 'wrapped', count: 1 + Math.floor(sectorId / 2) }],
    }
  }
  return { type: 'order', orders: [{ color, count: 12 + sectorId * 5 }] }
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
    if (i < 0 || i > 63 || avoid.has(i) || wanted.includes(i)) return
    wanted.push(i)
  }
  if (pattern === 0) {
    const col = 1 + (Math.floor(rand() * 3) % 3)
    for (let y = 1; y < 7; y++) tryAdd(col + y * 8)
    for (let y = 2; y < 6; y++) tryAdd(col + 3 + y * 8)
  } else if (pattern === 1) {
    for (let x = 1; x < 7; x++) {
      tryAdd(x + 8)
      tryAdd(x + 6 * 8)
    }
    for (let y = 2; y < 6; y++) {
      tryAdd(1 + y * 8)
      tryAdd(6 + y * 8)
    }
  } else if (pattern === 2) {
    for (let i = 0; i < 8; i++) tryAdd(i + i * 8)
    for (let i = 0; i < 6; i++) tryAdd(i + 2 + i * 8)
  } else if (pattern === 3) {
    const ox = rand() > 0.5 ? 0 : 4
    const oy = rand() > 0.5 ? 0 : 4
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        if ((x + y) % 2 === 0) tryAdd(ox + x + (oy + y) * 8)
      }
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
            const pattern = (nebulaIndex + systemIndex + stageIndex) % 5
            const frostingCount =
              sector.id === 1
                ? id > 6
                  ? 2 + Math.floor(rand() * 3) + nebulaIndex
                  : Math.floor(rand() * 2)
                : 5 + sector.id * 3 + systemIndex + nebulaIndex + Math.floor(rand() * (sector.id + 2))
            const frosting = patternFrosting(rand, frostingCount, pattern, avoid)
            const chocCount =
              sector.id >= 3
                ? 1 + sector.id - 3 + systemIndex + Math.floor(rand() * sector.id)
                : sector.id === 2 && nebulaIndex > 0
                  ? 1 + Math.floor(rand() * 2)
                  : 0
            const chocolate = chocCount > 0 ? pickIndices(rand, chocCount, avoid) : []
            const swirlCount = sector.id >= 2 ? 1 + nebulaIndex + Math.floor(rand() * sector.id) : 0
            const swirls = pickIndices(rand, swirlCount, avoid)
            const lockCount = sector.id >= 2 ? 1 + Math.floor(sector.id / 2) + (n % 2) : 0
            const locks = pickIndices(rand, lockCount, avoid)
            const marmCount =
              sector.id >= 3 ? 2 + Math.floor(rand() * 3) + nebulaIndex : id > 4 ? Math.floor(rand() * 2) : 0
            const marmalade = pickIndices(rand, marmCount, avoid)
            const bombCount = sector.id >= 4 ? 1 + Math.floor(rand() * (sector.id - 3)) + (nebulaIndex > 0 ? 1 : 0) : 0
            const bombs = pickIndices(rand, bombCount, avoid).map((index) => ({
              index,
              turns: Math.max(5, 12 - sector.id - systemIndex),
            }))
            const objective = makeObjective(rand, sector.id, id)
            const jelly = Array.from({ length: 64 }, () => 0)
            if (objective.type === 'jelly') {
              const maxLayer = sector.id >= 4 ? 2 : 1
              let placed = 0
              let g = 0
              while (placed < objective.remaining && g++ < 400) {
                const i = Math.floor(rand() * 64)
                if (jelly[i]! < maxLayer) {
                  jelly[i]! += 1
                  placed += 1
                }
              }
            }
            const ingredients =
              objective.type === 'ingredient'
                ? pickIndices(rand, objective.remaining, new Set(frosting))
                : []

            levels.push({
              id,
              seed,
              name: `${nebula.name} ${stageIndex + 1}-${n + 1}`,
              sectorId: sector.id,
              systemId,
              nebulaId,
              stageId,
              moves,
              colorCount,
              rewardCap: sectorMeta.rewardCap,
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
              timeLimit: levelTimeLimit(sector.id, id + n + nebulaIndex),
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

  if (levels.length !== 250) {
    throw new Error(`Campaign must be 250 levels, got ${levels.length}`)
  }

  return { sectors: SECTORS, systems, nebulas, stages, levels }
}

export const CAMPAIGN = generateCampaign()
export const LEVELS = CAMPAIGN.levels
export const LEVEL_BY_ID: Record<number, LevelConfig> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l]),
)

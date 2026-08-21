import type { LevelConfig, Objective, StarColor } from '~/engine/types'
import { STAR_COLORS } from '~/engine/types'
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
    return { type: 'jelly', remaining: 12 + sectorId * 8 + Math.floor(rand() * 8) }
  }
  if (roll === 1) {
    return { type: 'ingredient', remaining: 2 + Math.floor(sectorId / 2) + (rand() > 0.6 ? 1 : 0) }
  }
  const color = STAR_COLORS[Math.floor(rand() * Math.min(6, 3 + sectorId))] as StarColor
  if (rand() > 0.7) {
    return {
      type: 'order',
      orders: [{ special: rand() > 0.5 ? 'wrapped' : 'striped-h', count: 1 + Math.floor(sectorId / 2) }],
    }
  }
  return { type: 'order', orders: [{ color, count: 10 + sectorId * 4 }] }
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
    for (const system of sector.systems) {
      const systemId = `${sector.id}-${slug(system.name)}`
      const nebulaIds: string[] = []
      for (const nebula of system.nebulas) {
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
            const colorCount = Math.max(4, 6 - Math.floor((sector.id - 1) / 2))
            const moves = Math.max(12, 34 - sector.id * 3 - Math.floor(id / 40) + Math.floor(rand() * 4))
            const avoid = new Set<number>()
            const frostingCount = sector.id >= 2 ? Math.floor(rand() * sector.id * 3) : id > 8 ? Math.floor(rand() * 4) : 0
            const frosting = pickIndices(rand, frostingCount, avoid)
            const chocolate = sector.id >= 3 ? pickIndices(rand, Math.floor(rand() * sector.id), avoid) : []
            const swirls = sector.id >= 2 ? pickIndices(rand, Math.floor(rand() * (sector.id + 1)), avoid) : []
            const locks = sector.id >= 2 ? pickIndices(rand, Math.floor(rand() * 3), avoid) : []
            const marmalade = pickIndices(rand, sector.id >= 3 ? 2 + Math.floor(rand() * 4) : id > 5 ? Math.floor(rand() * 3) : 0, avoid)
            const bombs =
              sector.id >= 4
                ? pickIndices(rand, 1 + Math.floor(rand() * 2), avoid).map((index) => ({
                    index,
                    turns: 8 + Math.floor(rand() * 8),
                  }))
                : []
            const objective = makeObjective(rand, sector.id, id)
            const jelly = Array.from({ length: 64 }, () => 0)
            if (objective.type === 'jelly') {
              let placed = 0
              let g = 0
              while (placed < objective.remaining && g++ < 200) {
                const i = Math.floor(rand() * 64)
                if (jelly[i]! < 2) {
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
              exits: [1, 2, 3, 4, 5, 6],
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

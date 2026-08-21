export interface SectorDef {
  id: number
  name: string
  tagline: string
  color: string
  rewardCap: number
  colorCount: number
  levelCount: number
  systemCount: number
}

export interface SolarSystemDef {
  id: string
  sectorId: number
  name: string
  planet: string
  nebulaIds: string[]
}

export interface NebulaDef {
  id: string
  systemId: string
  sectorId: number
  name: string
  stageIds: string[]
}

export interface StageDef {
  id: string
  nebulaId: string
  name: string
  orbHue: number
  levelIds: number[]
}

export const SECTORS: SectorDef[] = [
  {
    id: 1,
    name: 'Nebula Novice',
    tagline: 'Warm dust and gentle orbits',
    color: '#7dd3fc',
    rewardCap: 40,
    colorCount: 5,
    levelCount: 40,
    systemCount: 2,
  },
  {
    id: 2,
    name: 'Orbit Adept',
    tagline: 'Tighter lanes, sharper burns',
    color: '#67e8f9',
    rewardCap: 70,
    colorCount: 6,
    levelCount: 45,
    systemCount: 3,
  },
  {
    id: 3,
    name: 'Gravity Veteran',
    tagline: 'Wells that crush careless swaps',
    color: '#c4b5fd',
    rewardCap: 110,
    colorCount: 6,
    levelCount: 50,
    systemCount: 3,
  },
  {
    id: 4,
    name: 'Supernova Elite',
    tagline: 'Shockwaves and scarce moves',
    color: '#f0abfc',
    rewardCap: 160,
    colorCount: 6,
    levelCount: 55,
    systemCount: 4,
  },
  {
    id: 5,
    name: 'Event Horizon',
    tagline: 'Nothing escapes a bad cascade',
    color: '#fb7185',
    rewardCap: 220,
    colorCount: 6,
    levelCount: 60,
    systemCount: 4,
  },
]

export const SYSTEM_NAMES = [
  ['Helios Veil', 'Lyra Drift'],
  ['Kepler Wake', 'Vela Cross', 'Io Burn'],
  ['Titan Well', 'Rigel Fuse', 'Nyx Anchor'],
  ['Pulsar Crown', 'Atlas Flare', 'Vespera', 'Hyperion Gate'],
  ['Singularity', 'Abyss Halo', 'Omega Fold', 'Horizon Deep'],
]

export const NEBULA_NAMES = [
  'Amber Cirrus',
  'Cobalt Bloom',
  'Violet Wake',
  'Ember Strait',
  'Ivory Spiral',
  'Sapphire Rift',
  'Crimson Halo',
  'Jade Stream',
  'Obsidian Veil',
  'Aurora Knot',
  'Pearl Current',
  'Ruby Meridian',
  'Indigo Shelf',
  'Solar Bramble',
  'Ghost Quasar',
  'Nacre Ring',
  'Storm Lattice',
  'Gilded Abyss',
  'Ion Orchard',
  'Midnight Prism',
]

function splitEven(total: number, parts: number): number[] {
  const base = Math.floor(total / parts)
  const rem = total % parts
  return Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0))
}

export interface Universe {
  sectors: SectorDef[]
  systems: SolarSystemDef[]
  nebulas: NebulaDef[]
  stages: StageDef[]
}

export function buildUniverse(): Universe {
  const systems: SolarSystemDef[] = []
  const nebulas: NebulaDef[] = []
  const stages: StageDef[] = []
  let levelCursor = 1
  let nebulaName = 0

  for (const sector of SECTORS) {
    const names = SYSTEM_NAMES[sector.id - 1]!
    const perSystem = splitEven(sector.levelCount, sector.systemCount)
    const nebulaCounts = sector.id === 1 ? [2, 2] : splitEven(Math.max(sector.systemCount + 1, 3), sector.systemCount)

    perSystem.forEach((sysLevels, si) => {
      const systemId = `s${sector.id}-${si + 1}`
      const nebulaPer = nebulaCounts[si] ?? 2
      const nebulaLevelCounts = splitEven(sysLevels, nebulaPer)
      const nebulaIds: string[] = []

      nebulaLevelCounts.forEach((nLevels, ni) => {
        const nebulaId = `${systemId}-n${ni + 1}`
        nebulaIds.push(nebulaId)
        const stageCount = nLevels <= 6 ? 2 : nLevels <= 12 ? 3 : 4
        const stageSizes = splitEven(nLevels, stageCount)
        const stageIds: string[] = []

        stageSizes.forEach((sz, sti) => {
          const stageId = `${nebulaId}-g${sti + 1}`
          stageIds.push(stageId)
          const levelIds: number[] = []
          for (let k = 0; k < sz; k++) {
            levelIds.push(levelCursor++)
          }
          stages.push({
            id: stageId,
            nebulaId,
            name: `Orb ${sti + 1}`,
            orbHue: (sector.id * 48 + ni * 22 + sti * 14) % 360,
            levelIds,
          })
        })

        nebulas.push({
          id: nebulaId,
          systemId,
          sectorId: sector.id,
          name: NEBULA_NAMES[nebulaName++ % NEBULA_NAMES.length]!,
          stageIds,
        })
      })

      systems.push({
        id: systemId,
        sectorId: sector.id,
        name: names[si] ?? `System ${si + 1}`,
        planet: ['ember', 'ice', 'gas', 'ring', 'lava'][si % 5]!,
        nebulaIds,
      })
    })
  }

  if (levelCursor - 1 !== 250) {
    throw new Error(`Universe must total 250 levels, got ${levelCursor - 1}`)
  }

  return { sectors: SECTORS, systems, nebulas, stages }
}

export const UNIVERSE = buildUniverse()

export function sectorById(id: number) {
  return SECTORS.find((s) => s.id === id)!
}

export function systemById(id: string) {
  return UNIVERSE.systems.find((s) => s.id === id)
}

export function nebulaById(id: string) {
  return UNIVERSE.nebulas.find((n) => n.id === id)
}

export function stageById(id: string) {
  return UNIVERSE.stages.find((s) => s.id === id)
}

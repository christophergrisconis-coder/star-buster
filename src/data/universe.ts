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

export interface NebulaSpec {
  name: string
  stages: number[]
}

export interface SystemSpec {
  name: string
  nebulas: NebulaSpec[]
}

export interface SectorSpec {
  id: number
  systems: SystemSpec[]
}

export const TREE: SectorSpec[] = [
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
  {
    id: 6,
    systems: [
      {
        name: 'Quantum Rift',
        nebulas: [
          { name: 'Chronos Veil', stages: [5, 5] },
          { name: 'Tesseract Fold', stages: [5, 5] },
        ],
      },
      {
        name: 'Dark Matter Core',
        nebulas: [
          { name: 'Graviton Spire', stages: [5, 5] },
          { name: 'Antimatter Shelf', stages: [5, 5] },
        ],
      },
      {
        name: 'Starlight Nexus',
        nebulas: [
          { name: 'Prism Horizon', stages: [5, 5] },
          { name: 'Genesis Core', stages: [5, 5] },
        ],
      },
      {
        name: 'Eternal Zenith',
        nebulas: [
          { name: 'Infinity Apex', stages: [5, 5] },
          { name: 'Cosmic Sovereign', stages: [5, 5] },
        ],
      },
    ],
  },
]

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
    levelCount: 51,
    systemCount: 3,
  },
  {
    id: 4,
    name: 'Supernova Elite',
    tagline: 'Shockwaves and scarce moves',
    color: '#f0abfc',
    rewardCap: 160,
    colorCount: 6,
    levelCount: 54,
    systemCount: 3,
  },
  {
    id: 5,
    name: 'Event Horizon',
    tagline: 'Nothing escapes a bad cascade',
    color: '#fb7185',
    rewardCap: 220,
    colorCount: 6,
    levelCount: 60,
    systemCount: 3,
  },
  {
    id: 6,
    name: 'Cosmic Singularity',
    tagline: 'Infinite gravity and quantum rifts',
    color: '#38bdf8',
    rewardCap: 300,
    colorCount: 6,
    levelCount: 80,
    systemCount: 4,
  },
]

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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

  for (const sector of TREE) {
    for (const [si, system] of sector.systems.entries()) {
      const systemId = `${sector.id}-${slug(system.name)}`
      const nebulaIds: string[] = []

      for (const [ni, nebula] of system.nebulas.entries()) {
        const nebulaId = `${systemId}-${slug(nebula.name)}`
        nebulaIds.push(nebulaId)
        const stageIds: string[] = []

        nebula.stages.forEach((count, sti) => {
          const stageId = `${nebulaId}-stage-${sti + 1}`
          stageIds.push(stageId)
          const levelIds: number[] = []
          for (let n = 0; n < count; n++) {
            levelIds.push(levelCursor++)
          }

          stages.push({
            id: stageId,
            nebulaId,
            name: `Orbit ${sti + 1}`,
            orbHue: (sector.id * 48 + ni * 22 + sti * 14) % 360,
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

      systems.push({
        id: systemId,
        sectorId: sector.id,
        name: system.name,
        planet: ['ember', 'ice', 'gas', 'ring', 'lava'][si % 5]!,
        nebulaIds,
      })
    }
  }

  if (levelCursor - 1 !== 330) {
    throw new Error(`Universe must total 330 levels, got ${levelCursor - 1}`)
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

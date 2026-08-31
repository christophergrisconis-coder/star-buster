export const PLANET_KINDS = [
  'terra',
  'mars',
  'europa',
  'jupiter',
  'io',
  'kepler',
  'venus',
  'luna',
  'neptune',
  'saturn',
] as const

export type PlanetKind = (typeof PLANET_KINDS)[number]

export type PlanetLook = {
  id: number
  kind: PlanetKind
  src: string
  glow: string
  atmosphere: string
  terrain: string
  bandAngle: number
  craterX: number
  craterY: number
  tilt: number
  spin: number
}

const GLOW: Record<PlanetKind, string> = {
  terra: '#7eb6e8',
  mars: '#e08a4a',
  europa: '#c9e4f6',
  jupiter: '#e0b15a',
  io: '#c4844a',
  kepler: '#6eb8e8',
  venus: '#e8c878',
  luna: '#c8c2b8',
  neptune: '#8ad4e8',
  saturn: '#d4b27a',
}

function mix(id: number, salt: number) {
  return Math.abs((id * 7919 + salt * 2971) % 1000) / 1000
}

function stableId(id: number, themeKey?: string) {
  if (!themeKey) return id
  let hash = id | 0
  for (let i = 0; i < themeKey.length; i++) hash = Math.imul(hash ^ themeKey.charCodeAt(i), 16777619)
  return hash >>> 0
}

function photo(kind: PlanetKind) {
  return `/voyage/planets/${kind}.png?v=5`
}

export function planetLook(id: number, themeKey?: string): PlanetLook {
  const seededId = stableId(id, themeKey)
  const kind = PLANET_KINDS[(Math.abs(id) - 1 + PLANET_KINDS.length) % PLANET_KINDS.length]!
  const hue = Math.round(mix(seededId, 23) * 360)
  const warm = Math.round((hue + 32 + mix(seededId, 29) * 26) % 360)
  return {
    id,
    kind,
    src: photo(kind),
    glow: GLOW[kind],
    atmosphere: `hsla(${hue} 82% 67% / 0.52)`,
    terrain: `hsla(${warm} 64% 43% / 0.45)`,
    bandAngle: Math.round(-38 + mix(seededId, 31) * 76),
    craterX: Math.round(24 + mix(seededId, 37) * 48),
    craterY: Math.round(28 + mix(seededId, 41) * 42),
    tilt: -10 + mix(seededId, 3) * 20,
    spin: 18 + mix(seededId, 11) * 22,
  }
}

export function nebulaTheme(nebulaId: string, fallback = '#6b7c8a') {
  let hash = 0
  for (let i = 0; i < nebulaId.length; i++) hash = (hash * 33 + nebulaId.charCodeAt(i)) >>> 0
  const hue = hash % 360
  return {
    hue,
    sky: 'transparent',
    mist: `hsla(${(hue + 14) % 360} 70% 58% / 0.12)`,
    bloom: `hsla(${(hue + 48) % 360} 68% 62% / 0.08)`,
    vein: fallback,
  }
}

export function schoolLook(): PlanetLook {
  return {
    id: 0,
    kind: 'luna',
    src: '/voyage/planets/luna.png?v=5',
    glow: '#ffd24a',
    atmosphere: 'rgba(255, 210, 74, 0.45)',
    terrain: 'rgba(198, 116, 48, 0.38)',
    bandAngle: -18,
    craterX: 38,
    craterY: 52,
    tilt: 8,
    spin: 28,
  }
}

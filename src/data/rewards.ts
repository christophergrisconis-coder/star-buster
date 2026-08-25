export const COMBO_WORDS = [
  'NICE',
  'SWEET',
  'STELLAR CHAIN',
  'HYPER BURST',
  'SUPERNOVA',
  'COSMIC ECLIPSE',
  'GALAXY BUSTER',
] as const

export const BADGES = [
  { id: 'first-orbit', name: 'First Orbit', at: 1, icon: '🌟', blurb: 'Cleared your first orbit' },
  { id: 'cascade-5', name: 'Cascade Pilot', at: 12, icon: '💫', blurb: 'Triggered 5+ chain cascades' },
  { id: 'system-clear', name: 'Helios Walker', at: 20, icon: '☀️', blurb: 'Fully conquered the Helios sector' },
  { id: 'veteran', name: 'Gravity Veteran', at: 90, icon: '🚀', blurb: 'Reached sector 3 with veteran rank' },
  { id: 'horizon', name: 'Event Horizon', at: 200, icon: '🌌', blurb: 'Entered the deep cosmic rim' },
  { id: 'buster', name: 'Star Buster', at: 250, icon: '👑', blurb: 'Completed all 250 campaign orbits' },
] as const

export const CHALLENGE_BADGES = [
  { id: 'tight-orbit', name: 'Tight Orbit', icon: '🎯', blurb: 'Completed orbit with 5+ moves to spare' },
  { id: 'sparse-fuel', name: 'Sparse Fuel', icon: '⚡', blurb: 'Won without activating solar kit' },
  { id: 'bloom-warden', name: 'Bloom Warden', icon: '🌸', blurb: 'Cleared all cosmic jelly in under 45s' },
  { id: 'hail-rider', name: 'Hail Rider', icon: '☄️', blurb: 'Shattered 20 asteroids in one game' },
  { id: 'naked-sky', name: 'Naked Sky', icon: '✨', blurb: 'Finished with a 3-star perfect clear' },
  { id: 'comet-oath', name: 'Comet Oath', icon: '🌠', blurb: 'Maintained 5x comet streak' },
] as const

export interface PilotTitle {
  id: string
  title: string
  requirement: string
  unlocked: (clearedCount: number, stars: number, cometStreak: number) => boolean
}

export const PILOT_TITLES: PilotTitle[] = [
  {
    id: 'cadet',
    title: 'Orbit Cadet',
    requirement: 'Default pilot rank',
    unlocked: () => true,
  },
  {
    id: 'nebula-nav',
    title: 'Nebula Navigator',
    requirement: 'Clear 10+ orbits',
    unlocked: (cleared) => cleared >= 10,
  },
  {
    id: 'supernova-hunter',
    title: 'Supernova Hunter',
    requirement: 'Earn 30+ total stars',
    unlocked: (_, stars) => stars >= 30,
  },
  {
    id: 'comet-whisperer',
    title: 'Comet Whisperer',
    requirement: 'Reach a 3x Comet Streak',
    unlocked: (_, __, streak) => streak >= 3,
  },
  {
    id: 'eclipse-walker',
    title: 'Eclipse Walker',
    requirement: 'Clear 50+ orbits',
    unlocked: (cleared) => cleared >= 50,
  },
  {
    id: 'stardust-master',
    title: 'Stardust Master',
    requirement: 'Earn 100+ total stars',
    unlocked: (_, stars) => stars >= 100,
  },
  {
    id: 'galaxy-conqueror',
    title: 'Galaxy Conqueror',
    requirement: 'Clear 150+ orbits',
    unlocked: (cleared) => cleared >= 150,
  },
]

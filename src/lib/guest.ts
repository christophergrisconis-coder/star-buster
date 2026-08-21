export interface GuestSave {
  coins: number
  stardust: number
  lives: number
  skin: string
  inventory: Record<string, number>
  progress: Record<number, { score: number; stars: number; completed: boolean }>
  highestUnlocked: number
}

const KEY = 'star-buster-guest'

export const GUEST_LEVEL_CAP = 3

export function defaultGuest(): GuestSave {
  return {
    coins: 120,
    stardust: 20,
    lives: 5,
    skin: 'nova-gold',
    inventory: { hammer: 1, striped: 1 },
    progress: {},
    highestUnlocked: 1,
  }
}

export function loadGuest(): GuestSave {
  if (typeof window === 'undefined') return defaultGuest()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultGuest()
    return { ...defaultGuest(), ...JSON.parse(raw) }
  } catch {
    return defaultGuest()
  }
}

export function saveGuest(save: GuestSave) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(save))
}

export function recordLevel(levelId: number, score: number, stars: number) {
  const save = loadGuest()
  const prev = save.progress[levelId]
  save.progress[levelId] = {
    score: Math.max(prev?.score ?? 0, score),
    stars: Math.max(prev?.stars ?? 0, stars),
    completed: true,
  }
  save.highestUnlocked = Math.max(save.highestUnlocked, levelId + 1)
  save.coins += Math.floor(score / 50)
  saveGuest(save)
  return save
}

export function starsForScore(score: number, movesLeft: number): number {
  if (score <= 0) return 0
  if (movesLeft >= 8 && score > 4000) return 3
  if (movesLeft >= 3 || score > 1800) return 2
  return 1
}

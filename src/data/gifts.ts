import { STORE_CATALOG, type StoreItem } from './store'

export const LIFE_MAX = 5

export function getMaxLives() {
  if (typeof window === 'undefined') return 5
  try {
    const raw = localStorage.getItem('star-buster-owner')
    if (raw && JSON.parse(raw).role === 'co-admin') return 7
  } catch {}
  return 5
}
export const LIFE_SEND_COOLDOWN_MS = 4 * 60 * 60 * 1000
export const HINT_COIN_COST = 40
export const CONTINUE_COIN_COST = 120
export const CONTINUE_MOVES = 5

const GIFTABLE_ITEMS = new Set([
  'solar-flare',
  'hammer',
  'gravity-well',
  'moves-5',
  'color-splash',
  'ion-wake-shield',
  'comet-tail-shield',
  'orbit-time',
])

export function giftPayload(item: StoreItem): string | null {
  if (item.hidden || item.kind === 'skin' || item.kind === 'nebula-skip' || item.kind === 'bundle' || item.kind === 'lives') {
    return null
  }
  if (item.grants) {
    const keys = Object.keys(item.grants)
    if (keys.length !== 1) return null
    const id = keys[0]!
    return GIFTABLE_ITEMS.has(id) ? id : null
  }
  return GIFTABLE_ITEMS.has(item.id) ? item.id : null
}

export function isGiftable(item: StoreItem): boolean {
  return giftPayload(item) !== null
}

export function dailyDeals(day = new Date().toISOString().slice(0, 10)): StoreItem[] {
  const pool = STORE_CATALOG.filter((item) => !item.hidden && item.minSector <= 3 && item.kind !== 'skin')
  let h = 2166136261
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const picks: StoreItem[] = []
  const used = new Set<string>()
  for (let n = 0; n < pool.length && picks.length < 3; n++) {
    h = Math.imul(h ^ (h >>> 16), 2246822519)
    const item = pool[(h >>> 0) % pool.length]!
    if (used.has(item.id)) continue
    used.add(item.id)
    picks.push(item)
  }
  return picks
}

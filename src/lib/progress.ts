import type { StoreItem } from '~/data/store'
import { guestUnlocked } from '~/data/levels'
import { BADGES } from '~/data/rewards'

const KEY = 'star-buster-progress'
const INV = 'star-buster-inventory'

export interface LevelRecord {
  levelId: number
  bestScore: number
  stars: number
  completed: boolean
}

export interface Inventory {
  coins: number
  stardust: number
  lives: number
  items: Record<string, number>
  skin: string
  sector: number
}

export interface ProgressBlob {
  levels: Record<number, LevelRecord>
  guest: boolean
}

const defaultInv = (): Inventory => ({
  coins: 400,
  stardust: 40,
  lives: 5,
  items: {},
  skin: 'nova-gold',
  sector: 1,
})

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function getProgress(): ProgressBlob {
  return read<ProgressBlob>(KEY, { levels: {}, guest: true })
}

export function getInventory(): Inventory {
  return read<Inventory>(INV, defaultInv())
}

export function highestUnlocked(): number {
  const p = getProgress()
  const completed = Object.values(p.levels)
    .filter((l) => l.completed)
    .map((l) => l.levelId)
  const max = completed.length ? Math.max(...completed) : 0
  const next = Math.min(250, max + 1)
  if (p.guest) return Math.max(next, 3)
  return Math.max(next, 1)
}

export function canPlay(levelId: number, authed: boolean): boolean {
  if (authed) return levelId <= highestUnlocked()
  return guestUnlocked(levelId)
}

export function recordWin(levelId: number, score: number, coins: number) {
  const p = getProgress()
  const prev = p.levels[levelId]
  const stars = score > 8000 ? 3 : score > 3000 ? 2 : 1
  p.levels[levelId] = {
    levelId,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    stars: Math.max(prev?.stars ?? 0, stars),
    completed: true,
  }
  write(KEY, p)
  const inv = getInventory()
  inv.coins += coins
  inv.sector = Math.max(inv.sector, Math.ceil(levelId / 50))
  write(INV, inv)
  return BADGES.find((b) => b.at === levelId)?.name ?? null
}

export function purchase(item: StoreItem): { error?: string } {
  const inv = getInventory()
  if (inv.sector < item.minSector) return { error: 'Sector gated' }
  if (item.currency === 'coins' && inv.coins < item.price) return { error: 'Need more coins' }
  if (item.currency === 'stardust' && inv.stardust < item.price) return { error: 'Need more stardust' }
  if (item.currency === 'coins') inv.coins -= item.price
  else inv.stardust -= item.price
  if (item.kind === 'lives') inv.lives += 5
  else if (item.kind === 'skin' && item.payload) inv.skin = item.payload
  else inv.items[item.id] = (inv.items[item.id] ?? 0) + 1
  write(INV, inv)
  return {}
}

export function consumeItem(id: string): boolean {
  const inv = getInventory()
  if (!inv.items[id]) return false
  inv.items[id] -= 1
  write(INV, inv)
  return true
}

export function mergeGuestIntoUser() {
  const p = getProgress()
  p.guest = false
  write(KEY, p)
}

export function exportGuestSaves() {
  return getProgress()
}

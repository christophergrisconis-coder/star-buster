import type { StoreItem } from '~/data/store'
import { LEVEL_BY_ID } from '~/data/campaign'
import { BADGES } from '~/data/rewards'
import {
  canSkipLevel,
  isLevelPlayable,
  nextPlayTarget,
  nextSequentialLevel,
} from './lock'

const KEY = 'star-buster-progress'
const INV = 'star-buster-inventory'
const FRIENDS = 'star-buster-friends'

export interface LevelRecord {
  levelId: number
  bestScore: number
  stars: number
  completed: boolean
  challenges?: string[]
}

export interface Inventory {
  coins: number
  stardust: number
  lives: number
  items: Record<string, number>
  skin: string
  sector: number
  kitSeeded?: boolean
}

export interface ProgressBlob {
  levels: Record<number, LevelRecord>
  guest: boolean
  nebulaChallenges?: Record<string, { completed: boolean; at?: string }>
  challengeRerolls?: Record<string, number>
  badges?: string[]
  lastNebulaId?: string
  lastActiveAt?: number
}

export interface LocalFriend {
  displayName: string
  lastNebula: string
  lastActive: string
  avatar: string
}

const ADMIN_KIT: Record<string, number> = {
  hammer: 5,
  'solar-flare': 5,
  'moves-5': 3,
  'orbit-time': 3,
  'gravity-well': 2,
  'color-splash': 2,
  'ion-wake-shield': 2,
  'star-shuffle': 1,
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

const ADMIN_KEY = 'star-buster-admin'

export function isAdminPilot(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ADMIN_KEY) === '1' || import.meta.env.DEV
}

export function setAdminPilot(on: boolean) {
  if (typeof window === 'undefined') return
  if (on) localStorage.setItem(ADMIN_KEY, '1')
  else localStorage.removeItem(ADMIN_KEY)
}

export function grantItem(id: string, n = 1) {
  const inv = getInventory()
  inv.items[id] = (inv.items[id] ?? 0) + n
  write(INV, inv)
}

export function grantAdminKit(): { error?: string } {
  if (!isAdminPilot()) return { error: 'Admin only' }
  const inv = getInventory()
  for (const [id, n] of Object.entries(ADMIN_KIT)) {
    inv.items[id] = (inv.items[id] ?? 0) + n
  }
  write(INV, inv)
  return {}
}

export function highestUnlocked(): number {
  const p = getProgress()
  const next = nextSequentialLevel(p)
  if (p.guest) return Math.max(next, 3)
  return next
}

export function canPlay(levelId: number, _authed?: boolean): boolean {
  return isLevelPlayable(levelId, getProgress())
}

export function playTarget() {
  return nextPlayTarget(getProgress())
}

export function recordWin(
  levelId: number,
  score: number,
  coins: number,
  extra?: { stars?: number; stardust?: number; challenges?: string[]; nebulaChallengeId?: string; badge?: string },
) {
  const p = getProgress()
  const prev = p.levels[levelId]
  const baseStars = extra?.stars ?? (score > 8000 ? 3 : score > 3000 ? 2 : 1)
  const stars = Math.min(3, Math.max(prev?.stars ?? 0, baseStars))
  const challenges = [...new Set([...(prev?.challenges ?? []), ...(extra?.challenges ?? [])])]
  p.levels[levelId] = {
    levelId,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    stars,
    completed: true,
    challenges,
  }
  const level = LEVEL_BY_ID[levelId]
  if (level) p.lastNebulaId = level.nebulaId
  p.lastActiveAt = Date.now()
  if (extra?.nebulaChallengeId) {
    p.nebulaChallenges = {
      ...(p.nebulaChallenges ?? {}),
      [extra.nebulaChallengeId]: { completed: true, at: new Date().toISOString() },
    }
  }
  if (extra?.badge) {
    p.badges = [...new Set([...(p.badges ?? []), extra.badge])]
  }
  write(KEY, p)
  const inv = getInventory()
  inv.coins += coins
  if (extra?.stardust) inv.stardust += extra.stardust
  inv.sector = Math.max(inv.sector, level?.sectorId ?? Math.ceil(levelId / 50))
  write(INV, inv)
  return extra?.badge ?? BADGES.find((b) => b.at === levelId)?.name ?? null
}

export function completedChallenges(levelId: number): string[] {
  return getProgress().levels[levelId]?.challenges ?? []
}

export function nebulaChallengeComplete(challengeId: string): boolean {
  return Boolean(getProgress().nebulaChallenges?.[challengeId]?.completed)
}

export function earnedBadges(): string[] {
  return getProgress().badges ?? []
}

export function getRerollSeed(nebulaId: string): number {
  return getProgress().challengeRerolls?.[nebulaId] ?? 0
}

export function bumpReroll(nebulaId: string): { error?: string } {
  if (!consumeItem('challenge-reroll')) return { error: 'Need a challenge reroll' }
  const p = getProgress()
  p.challengeRerolls = { ...(p.challengeRerolls ?? {}), [nebulaId]: (p.challengeRerolls?.[nebulaId] ?? 0) + 1 }
  write(KEY, p)
  return {}
}

export function skipNextLevel(): { error?: string; levelId?: number } {
  const p = getProgress()
  const { levelId } = nextPlayTarget(p)
  if (!canSkipLevel(levelId, p)) return { error: 'Cannot skip locked sectors' }
  if (!consumeItem('nebula-skip')) return { error: 'Need a nebula skip ticket' }
  recordWin(levelId, 0, 0, { stars: 1 })
  return { levelId }
}

export function purchase(item: StoreItem): { error?: string } {
  const inv = getInventory()
  if (inv.sector < item.minSector) return { error: 'Sector gated' }
  if (item.currency === 'coins' && inv.coins < item.price) return { error: 'Need more coins' }
  if (item.currency === 'stardust' && inv.stardust < item.price) return { error: 'Need more stardust' }
  if (item.currency === 'coins') inv.coins -= item.price
  else inv.stardust -= item.price
  if (item.kind === 'lives') inv.lives += item.qty ?? 5
  else if (item.kind === 'skin' && item.payload) inv.skin = item.payload
  else if (item.grants) {
    for (const [id, n] of Object.entries(item.grants)) {
      inv.items[id] = (inv.items[id] ?? 0) + n
    }
  } else {
    inv.items[item.id] = (inv.items[item.id] ?? 0) + (item.qty ?? 1)
  }
  write(INV, inv)
  return {}
}

export function consumeItem(id: string): boolean {
  const inv = getInventory()
  if (!inv.items[id]) return false
  inv.items[id] -= 1
  if (inv.items[id] <= 0) delete inv.items[id]
  write(INV, inv)
  return true
}

export function consumeAny(ids: string[]): boolean {
  for (const id of ids) {
    if (consumeItem(id)) return true
  }
  return false
}

export function itemCount(id: string): number {
  return getInventory().items[id] ?? 0
}

export const FLARE_ITEM_IDS = ['solar-flare', 'booster-wrapped', 'booster-striped', 'booster-nova'] as const

export function flareCount(): number {
  return FLARE_ITEM_IDS.reduce((n, id) => n + itemCount(id), 0)
}

export function countItems(ids: readonly string[]): number {
  return ids.reduce((n, id) => n + itemCount(id), 0)
}

export function mergeGuestIntoUser() {
  const p = getProgress()
  p.guest = false
  write(KEY, p)
}

export function exportGuestSaves() {
  return getProgress()
}

export function getLocalFriends(): LocalFriend[] {
  return read<LocalFriend[]>(FRIENDS, [])
}

export function addLocalFriend(friend: LocalFriend): { error?: string } {
  const list = getLocalFriends()
  if (list.some((f) => f.displayName.toLowerCase() === friend.displayName.toLowerCase())) {
    return { error: 'Already in your crew' }
  }
  list.push(friend)
  write(FRIENDS, list)
  return {}
}

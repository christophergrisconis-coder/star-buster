import type { StoreItem } from '~/data/store'
import { LEVEL_BY_ID } from '~/data/campaign'
import { getMaxLives } from '~/data/gifts'
import { BADGES } from '~/data/rewards'
import {
  canSkipLevel,
  isLevelPlayable,
  nebulaLevelIds,
  nebulaRequiredComplete,
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
  admin?: boolean
  nebulaChallenges?: Record<string, { completed: boolean; at?: string }>
  challengeRerolls?: Record<string, number>
  badges?: string[]
  equippedTitle?: string
  lastNebulaId?: string
  lastActiveAt?: number
  stamps?: Record<string, boolean>
  cometStreak?: number
  cometBest?: number
  dailyBest?: Record<string, number>
}

export interface LocalFriend {
  displayName: string
  lastNebula: string
  lastActive: string
  avatar: string
}

const ADMIN_KIT: Record<string, number> = {
  hammer: 99,
  'solar-flare': 99,
  'moves-5': 99,
  'orbit-time': 99,
  'orbit-time-deep': 99,
  'freeze-orbit': 99,
  'gravity-well': 99,
  'color-splash': 99,
  'ion-wake-shield': 99,
  'comet-tail-shield': 99,
  'star-shuffle': 99,
  'nebula-boost': 99,
  'challenge-reroll': 99,
  'nebula-skip': 99,
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
  if (localStorage.getItem(ADMIN_KEY) === '1') return true
  return import.meta.env.DEV && localStorage.getItem(ADMIN_KEY) === 'dev'
}

export function loginAdminDock(password: string): { error?: string } {
  const dock = import.meta.env.VITE_ADMIN_PASSWORD
  const owner = import.meta.env.VITE_OWNER_PASSWORD
  if (!dock && !owner) return { error: 'Admin dock is not configured on this build' }
  const code = password.trim()
  if (!(dock && code === dock) && !(owner && code === owner)) return { error: 'Wrong dock code' }
  setAdminPilot(true)
  unlockAdminVoyage()
  return {}
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
  unlockAdminVoyage()
  return {}
}

export function unlockAdminVoyage() {
  const p = getProgress()
  p.guest = false
  p.admin = true
  write(KEY, p)
  const inv = getInventory()
  inv.coins = Math.max(inv.coins, 99_999)
  inv.stardust = Math.max(inv.stardust, 99_999)
  inv.lives = getMaxLives()
  inv.sector = 5
  for (const [id, n] of Object.entries(ADMIN_KIT)) {
    inv.items[id] = Math.max(inv.items[id] ?? 0, n)
  }
  write(INV, inv)
}

/** Co-admin (Anaclara) seed — unlock voyage + starter kit without full admin pilot flag. */
export function seedCoAdminCampaign() {
  const p = getProgress()
  p.guest = false
  write(KEY, p)
  const inv = getInventory()
  inv.coins = Math.max(inv.coins, 25_000)
  inv.stardust = Math.max(inv.stardust, 5_000)
  inv.lives = getMaxLives()
  inv.sector = Math.max(inv.sector, 3)
  for (const [id, n] of Object.entries(ADMIN_KIT)) {
    inv.items[id] = Math.max(inv.items[id] ?? 0, Math.ceil(n / 2))
  }
  write(INV, inv)
}

export function highestUnlocked(): number {
  const p = getProgress()
  if (p.admin || isAdminPilot()) return 999
  const next = nextSequentialLevel(p)
  if (p.guest) return Math.max(next, 3)
  return next
}

export function canPlay(levelId: number, _authed?: boolean): boolean {
  if (isAdminPilot()) return Number.isFinite(levelId) && levelId >= 1
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
  const nebulaId = LEVEL_BY_ID[levelId]?.nebulaId
  const nebulaWasDone = nebulaId ? nebulaRequiredComplete(nebulaId, p) : true
  const sectorBefore = getInventory().sector
  const alreadyStamped = Boolean(nebulaId && p.stamps?.[nebulaId])
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
  const stampedNow = Boolean(nebulaId && nebulaAllStarred(nebulaId, p) && !alreadyStamped)
  if (stampedNow && nebulaId) {
    p.stamps = { ...(p.stamps ?? {}), [nebulaId]: true }
  }
  write(KEY, p)
  const inv = getInventory()
  inv.coins += coins
  if (extra?.stardust) inv.stardust += extra.stardust
  inv.sector = Math.max(inv.sector, level?.sectorId ?? Math.ceil(levelId / 50))
  write(INV, inv)
  if (nebulaId && !nebulaWasDone && nebulaRequiredComplete(nebulaId, p)) grantLives(1)
  if (getInventory().sector > sectorBefore) grantLives(1)
  if (stampedNow) {
    grantItem('solar-flare', 2)
    grantItem('hammer', 1)
  }
  return extra?.badge ?? BADGES.find((b) => b.at === levelId)?.name ?? null
}

export function nebulaAllStarred(nebulaId: string, progress = getProgress()): boolean {
  const ids = nebulaLevelIds(nebulaId)
  if (!ids.length) return false
  return ids.every((id) => (progress.levels[id]?.stars ?? 0) >= 3)
}

export function applyLifeRegen(): void {
  const inv = getInventory()
  if (inv.lives < getMaxLives()) {
    // Regenerate lives towards max
    const lastRegenKey = 'star-buster-last-regen'
    const now = Date.now()
    const last = Number(localStorage.getItem(lastRegenKey) || now)
    const passedMinutes = Math.floor((now - last) / (15 * 60 * 1000))
    if (passedMinutes >= 1) {
      const added = Math.min(getMaxLives() - inv.lives, passedMinutes)
      inv.lives += added
      write(INV, inv)
      localStorage.setItem(lastRegenKey, String(now))
    }
  }
}

export function grantLives(n = 1): boolean {
  const inv = getInventory()
  if (inv.lives >= getMaxLives()) return false
  inv.lives = Math.min(getMaxLives(), inv.lives + n)
  write(INV, inv)
  return true
}

export function grantCoins(n: number) {
  const inv = getInventory()
  inv.coins += n
  write(INV, inv)
}

export function grantStardust(n: number) {
  const inv = getInventory()
  inv.stardust += n
  write(INV, inv)
}

export function spendStardust(n: number): { error?: string } {
  const inv = getInventory()
  if (inv.stardust < n) return { error: 'Not enough stardust' }
  inv.stardust -= n
  write(INV, inv)
  return {}
}

export function spendLife(): boolean {
  const inv = getInventory()
  if (inv.lives <= 0) return false
  inv.lives -= 1
  write(INV, inv)
  return true
}

export function spendSpareLife(): boolean {
  if (getInventory().lives <= 1) return false
  return spendLife()
}

export function spendCoins(n: number): boolean {
  const inv = getInventory()
  if (inv.coins < n) return false
  inv.coins -= n
  write(INV, inv)
  return true
}

export function bumpCometStreak(peak: number, won: boolean) {
  const p = getProgress()
  if (won && peak >= 3) {
    p.cometStreak = (p.cometStreak ?? 0) + 1
    p.cometBest = Math.max(p.cometBest ?? 0, p.cometStreak)
  } else if (!won) {
    p.cometStreak = 0
  }
  write(KEY, p)
}

export function recordDailyScore(day: string, score: number) {
  const p = getProgress()
  p.dailyBest = { ...(p.dailyBest ?? {}), [day]: Math.max(p.dailyBest?.[day] ?? 0, score) }
  write(KEY, p)
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

export function getEquippedTitle(): string {
  return getProgress().equippedTitle ?? 'Orbit Cadet'
}

export function setEquippedTitle(title: string) {
  const p = getProgress()
  p.equippedTitle = title
  write(KEY, p)
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
  const admin = isAdminPilot()
  if (!admin && inv.sector < item.minSector) return { error: 'Sector gated' }
  if (!admin && item.currency === 'coins' && inv.coins < item.price) return { error: 'Need more coins' }
  if (!admin && item.currency === 'stardust' && inv.stardust < item.price) return { error: 'Need more stardust' }
  if (!admin) {
    if (item.currency === 'coins') inv.coins -= item.price
    else inv.stardust -= item.price
  }
  if (item.kind === 'lives') {
    if (inv.lives >= getMaxLives()) return { error: 'Pulse well is full (5)' }
    inv.lives = Math.min(getMaxLives(), inv.lives + (item.qty ?? 5))
  }
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

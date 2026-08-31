import { LOCAL_CREW } from '~/data/friends'
import { LIFE_SEND_COOLDOWN_MS } from '~/data/gifts'
import { accountStorageKey, consumeItem, grantItem, grantLives, spendSpareLife, type LocalFriend } from './progress'

const MAIL = 'star-buster-mail'
const GIFTS = 'star-buster-gifts'
const COOL = 'star-buster-life-cd'
const PENDING = 'star-buster-pending'
const DAILY_IN = 'star-buster-daily-in'
const WISH = 'star-buster-wish'

export type MailKind = 'chat' | 'gift' | 'life' | 'system'

export interface MailItem {
  id: string
  from: string
  to?: string
  body: string
  kind: MailKind
  itemId?: string
  at: number
  claimed?: boolean
}

export interface PendingCrew {
  displayName: string
  lastNebula: string
  lastActive: string
  incoming: boolean
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(accountStorageKey(key))
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(accountStorageKey(key), JSON.stringify(value))
}

export function getMail(): MailItem[] {
  return read<MailItem[]>(MAIL, [])
}

export function pushMail(item: Omit<MailItem, 'id' | 'at'> & { id?: string; at?: number }) {
  const list = getMail()
  list.unshift({
    id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: item.at ?? Date.now(),
    claimed: item.claimed,
    from: item.from,
    to: item.to,
    body: item.body,
    kind: item.kind,
    itemId: item.itemId,
  })
  write(MAIL, list.slice(0, 80))
}

export function getPendingCrew(): PendingCrew[] {
  return read<PendingCrew[]>(PENDING, [])
}

export function seedIncomingPing() {
  if (typeof window === 'undefined') return
  const seededKey = accountStorageKey('star-buster-ping-seeded')
  if (localStorage.getItem(seededKey)) return
  localStorage.setItem(seededKey, '1')
  const ping = LOCAL_CREW[0]!
  write(PENDING, [
    {
      displayName: ping.displayName,
      lastNebula: ping.lastNebula,
      lastActive: ping.lastActive,
      incoming: true,
    },
  ])
}

export function respondLocalRequest(name: string, accept: boolean, onAccept: (friend: LocalFriend) => { error?: string }) {
  const next = getPendingCrew().filter((p) => p.displayName !== name)
  write(PENDING, next)
  if (!accept) return {}
  const ping = LOCAL_CREW.find((p) => p.displayName === name)
  return onAccept(
    ping ?? { displayName: name, lastNebula: 'Unknown wake', lastActive: 'just now', avatar: name[0] ?? '?' },
  )
}

export function sendLocalRequest(name: string) {
  const list = getPendingCrew()
  if (list.some((p) => p.displayName.toLowerCase() === name.toLowerCase())) return { error: 'Already pinged' }
  const ping = LOCAL_CREW.find((p) => p.displayName === name)
  list.push({
    displayName: name,
    lastNebula: ping?.lastNebula ?? 'Deep space',
    lastActive: 'just now',
    incoming: false,
  })
  write(PENDING, list)
  return {}
}

function coolKey(name: string) {
  return name.toLowerCase()
}

export function lifeSendReady(name: string): { ok: boolean; waitMs: number } {
  const map = read<Record<string, number>>(COOL, {})
  const last = map[coolKey(name)] ?? 0
  const waitMs = LIFE_SEND_COOLDOWN_MS - (Date.now() - last)
  return { ok: waitMs <= 0, waitMs: Math.max(0, waitMs) }
}

export function undoLifeSend(name: string) {
  const map = read<Record<string, number>>(COOL, {})
  delete map[coolKey(name)]
  write(COOL, map)
}

export function sendLifeTo(name: string, opts?: { echo?: boolean }): { error?: string } {
  const ready = lifeSendReady(name)
  if (!ready.ok) {
    const h = Math.ceil(ready.waitMs / 3_600_000)
    return { error: `Pulse already sent. Wait ${h}h` }
  }
  if (!spendSpareLife()) return { error: 'Need a spare pulse — keep at least one' }
  const map = read<Record<string, number>>(COOL, {})
  map[coolKey(name)] = Date.now()
  write(COOL, map)
  pushMail({ from: 'You', to: name, kind: 'life', body: `You sent a pulse to ${name}` })
  if (opts?.echo === false) return {}
  const incoming = read<MailItem[]>(GIFTS, [])
  incoming.unshift({
    id: `in-${Date.now()}`,
    from: name,
    kind: 'life',
    body: `${name} will return a pulse when they dock. A courtesy pulse is waiting.`,
    at: Date.now(),
    claimed: false,
  })
  write(GIFTS, incoming.slice(0, 40))
  return {}
}

export function sendItemTo(name: string, itemId: string, opts?: { echo?: boolean }): { error?: string } {
  if (!consumeItem(itemId)) return { error: 'You do not own that charge' }
  pushMail({ from: 'You', to: name, kind: 'gift', itemId, body: `You sent ${itemId} to ${name}` })
  if (opts?.echo === false) return {}
  const incoming = read<MailItem[]>(GIFTS, [])
  incoming.unshift({
    id: `gift-${Date.now()}`,
    from: name,
    kind: 'gift',
    itemId,
    body: `${name} left a return kit in your bay`,
    at: Date.now(),
    claimed: false,
  })
  write(GIFTS, incoming.slice(0, 40))
  return {}
}

export function incomingGifts(): MailItem[] {
  return read<MailItem[]>(GIFTS, []).filter((g) => !g.claimed)
}

export function claimGift(id: string): { error?: string } {
  const list = read<MailItem[]>(GIFTS, [])
  const hit = list.find((g) => g.id === id)
  if (!hit || hit.claimed) return { error: 'Already claimed' }
  if (hit.kind === 'life') {
    if (!grantLives(1)) return { error: 'Pulse well is full (5)' }
  } else if (hit.itemId) {
    grantItem(hit.itemId, 1)
  }
  hit.claimed = true
  write(GIFTS, list)
  return {}
}

export function claimDailyCrewPulse(): { error?: string; from?: string } {
  const day = new Date().toISOString().slice(0, 10)
  if (read<string>(DAILY_IN, '') === day) return { error: 'Already claimed today' }
  const from = LOCAL_CREW[1]?.displayName ?? 'Nyx Drift'
  if (!grantLives(1)) return { error: 'Pulse well is full (5)' }
  write(DAILY_IN, day)
  pushMail({ from, kind: 'life', body: `${from} sent you a pulse` })
  return { from }
}

export function sendChat(to: string, body: string, opts?: { echo?: boolean }): { error?: string } {
  const text = body.trim().slice(0, 180)
  if (!text) return { error: 'Empty signal' }
  pushMail({ from: 'You', to, kind: 'chat', body: text })
  if (opts?.echo === false) return {}
  pushMail({
    from: to,
    kind: 'chat',
    body: `${to}: copy that — see you in ${LOCAL_CREW.find((p) => p.displayName === to)?.lastNebula ?? 'the wake'}`,
  })
  return {}
}

export function getWishlist(): string[] {
  return read<string[]>(WISH, [])
}

export function toggleWish(id: string) {
  const list = getWishlist()
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(0, 24)
  write(WISH, next)
  return next
}

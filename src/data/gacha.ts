import { rngInt } from '~/engine/prng'

export type GachaRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface GachaPrize {
  id: string
  name: string
  rarity: GachaRarity
  kind: 'item' | 'coins' | 'stardust' | 'skin' | 'lives'
  itemId?: string
  quantity: number
}

const POOL: GachaPrize[] = [
  { id: 'g-hammer-3', name: 'Meteor Hammer ×3', rarity: 'common', kind: 'item', itemId: 'hammer', quantity: 3 },
  { id: 'g-flare-3', name: 'Solar Flare ×3', rarity: 'common', kind: 'item', itemId: 'solar-flare', quantity: 3 },
  { id: 'g-moves-2', name: 'Fuel Cell ×2', rarity: 'common', kind: 'item', itemId: 'moves-5', quantity: 2 },
  { id: 'g-coins-200', name: '200 Coins', rarity: 'common', kind: 'coins', quantity: 200 },
  { id: 'g-lives-3', name: '3 Lives', rarity: 'common', kind: 'lives', quantity: 3 },
  { id: 'g-well-2', name: 'Gravity Well ×2', rarity: 'rare', kind: 'item', itemId: 'gravity-well', quantity: 2 },
  { id: 'g-splash-2', name: 'Color Splash ×2', rarity: 'rare', kind: 'item', itemId: 'color-splash', quantity: 2 },
  { id: 'g-shuffle-3', name: 'Sky Remix ×3', rarity: 'rare', kind: 'item', itemId: 'star-shuffle', quantity: 3 },
  { id: 'g-coins-500', name: '500 Coins', rarity: 'rare', kind: 'coins', quantity: 500 },
  { id: 'g-stardust-60', name: '60 Stardust', rarity: 'rare', kind: 'stardust', quantity: 60 },
  { id: 'g-shield-2', name: 'Ion Shield ×2', rarity: 'epic', kind: 'item', itemId: 'ion-wake-shield', quantity: 2 },
  { id: 'g-comet-2', name: 'Comet Shield ×2', rarity: 'epic', kind: 'item', itemId: 'comet-tail-shield', quantity: 2 },
  { id: 'g-nebula-skip', name: 'Nebula Skip', rarity: 'epic', kind: 'item', itemId: 'nebula-skip', quantity: 1 },
  { id: 'g-stardust-150', name: '150 Stardust', rarity: 'epic', kind: 'stardust', quantity: 150 },
  { id: 'g-coins-1500', name: '1500 Coins', rarity: 'epic', kind: 'coins', quantity: 1500 },
  { id: 'g-mega-pack', name: 'Mega Pack (all kits ×5)', rarity: 'legendary', kind: 'item', itemId: 'hammer', quantity: 5 },
  { id: 'g-stardust-500', name: '500 Stardust', rarity: 'legendary', kind: 'stardust', quantity: 500 },
  { id: 'g-coins-5000', name: '5000 Coins', rarity: 'legendary', kind: 'coins', quantity: 5000 },
]

const MEGA_PACK_ITEMS = [
  'hammer', 'solar-flare', 'moves-5', 'gravity-well', 'color-splash',
  'star-shuffle', 'ion-wake-shield', 'comet-tail-shield',
]

const RARITY_WEIGHTS: Record<GachaRarity, number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
}

export const DRAW_COST = 80

export const RARITY_COLORS: Record<GachaRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

export function drawPrize(rngState: number): { prize: GachaPrize; rngState: number } {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0)
  const { n: roll, state: rng1 } = rngInt(rngState, totalWeight)

  let rarity: GachaRarity = 'common'
  let acc = 0
  for (const [r, w] of Object.entries(RARITY_WEIGHTS) as [GachaRarity, number][]) {
    acc += w
    if (roll < acc) {
      rarity = r
      break
    }
  }

  const tier = POOL.filter((p) => p.rarity === rarity)
  const { n: idx, state: rng2 } = rngInt(rng1, tier.length)
  return { prize: tier[idx]!, rngState: rng2 }
}

export function isMegaPack(prize: GachaPrize): boolean {
  return prize.id === 'g-mega-pack'
}

export function megaPackItems(): Array<{ itemId: string; quantity: number }> {
  return MEGA_PACK_ITEMS.map((id) => ({ itemId: id, quantity: 5 }))
}

export function dailyFreeDrawAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const key = 'star-buster-free-draw'
  const today = new Date().toISOString().slice(0, 10)
  const last = localStorage.getItem(key)
  return last !== today
}

export function claimFreeDraw(): void {
  if (typeof window === 'undefined') return
  const key = 'star-buster-free-draw'
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(key, today)
}

import type { BlastSize } from '~/engine/types'
import { nextRng, rngPick } from '~/engine/prng'

export type KitSlotId = 'flare' | 'hammer' | 'well' | 'moves' | 'orbit' | 'splash' | 'shield' | 'shuffle'

export type KitUse = 'arm' | 'instant'

export interface KitSlot {
  id: KitSlotId
  item: string
  altItems?: string[]
  label: string
  blurb: string
  minSector: number
  use: KitUse
}

export const KIT_SLOTS: KitSlot[] = [
  { id: 'flare', item: 'solar-flare', altItems: ['booster-wrapped', 'booster-striped', 'booster-nova'], label: 'Flare', blurb: 'Plant a sun and ignite a 5×5 burst', minSector: 1, use: 'arm' },
  { id: 'hammer', item: 'hammer', label: 'Meteor', blurb: 'Shatter one tile', minSector: 1, use: 'arm' },
  { id: 'well', item: 'gravity-well', label: 'Well', blurb: 'Crush a 3×3 pocket', minSector: 2, use: 'arm' },
  { id: 'moves', item: 'moves-5', label: 'Fuel', blurb: '+5 moves', minSector: 1, use: 'instant' },
  { id: 'orbit', item: 'orbit-time', altItems: ['orbit-time-deep', 'freeze-orbit'], label: 'Clock', blurb: 'Add orbit time', minSector: 1, use: 'instant' },
  { id: 'splash', item: 'color-splash', label: 'Splash', blurb: 'Repaint nearby stars to one hue', minSector: 3, use: 'arm' },
  { id: 'shield', item: 'ion-wake-shield', altItems: ['comet-tail-shield'], label: 'Wake', blurb: 'Arm a shield for the next Comet Tail fade', minSector: 2, use: 'instant' },
  { id: 'shuffle', item: 'star-shuffle', label: 'Remix', blurb: 'Shuffle the sky', minSector: 4, use: 'instant' },
]

const DROP_CHANCE: number[] = [0, 0.18, 0.11, 0.07, 0.045, 0.028]
const DROP_CAP: number[] = [0, 3, 2, 2, 1, 1]

export function kitDropChance(sectorId: number, combo: number, blast: BlastSize): number {
  const sector = Math.min(5, Math.max(1, sectorId))
  let chance = DROP_CHANCE[sector] ?? 0.028
  if (combo < 2 && blast === 'S') chance *= 0.28
  else if (combo >= 4 || blast === 'L') chance = Math.min(0.26, chance * 1.35)
  return chance
}

export function kitDropCap(sectorId: number): number {
  const sector = Math.min(5, Math.max(1, sectorId))
  return DROP_CAP[sector] ?? 1
}

export function droppableSlots(sectorId: number): KitSlot[] {
  return KIT_SLOTS.filter((slot) => slot.minSector <= sectorId)
}

export function rollKitDrop(
  rngState: number,
  sectorId: number,
  combo: number,
  blast: BlastSize,
  already: number,
): { item: string | null; indexJitter: number; rngState: number } {
  if (sectorId <= 0) return { item: null, indexJitter: 0, rngState }
  if (already >= kitDropCap(sectorId)) return { item: null, indexJitter: 0, rngState }
  const pool = droppableSlots(sectorId)
  if (pool.length === 0) return { item: null, indexJitter: 0, rngState }
  const roll = nextRng(rngState)
  if (roll.value > kitDropChance(sectorId, combo, blast)) {
    return { item: null, indexJitter: 0, rngState: roll.state }
  }
  const pick = rngPick(roll.state, pool)
  const jitter = nextRng(pick.state)
  return { item: pick.item.item, indexJitter: jitter.value, rngState: jitter.state }
}

export function slotById(id: KitSlotId): KitSlot {
  return KIT_SLOTS.find((s) => s.id === id)!
}

export function kitItemIds(slot: KitSlot): string[] {
  return [slot.item, ...(slot.altItems ?? [])]
}

export function kitLabelForItem(item: string): string {
  const slot = KIT_SLOTS.find((s) => kitItemIds(s).includes(item))
  return slot?.label ?? 'Kit'
}

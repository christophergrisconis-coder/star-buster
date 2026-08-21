export type StoreKind =
  | 'lives'
  | 'moves'
  | 'striped'
  | 'wrapped'
  | 'color-bomb'
  | 'hammer'
  | 'color-splash'
  | 'skin'
  | 'nebula-booster'
  | 'streak-shield'

export interface StoreItem {
  id: string
  kind: StoreKind
  name: string
  blurb: string
  price: number
  currency: 'coins' | 'stardust'
  minSector: number
  preview: 'life' | 'stripe' | 'wrap' | 'nova' | 'hammer' | 'splash' | 'skin' | 'shield' | 'nebula'
  payload?: string
}

export const STORE_CATALOG: StoreItem[] = [
  { id: 'life-pack', kind: 'lives', name: 'Pulse Pack', blurb: 'Refill 5 voyage lives', price: 90, currency: 'coins', minSector: 1, preview: 'life' },
  { id: 'moves-5', kind: 'moves', name: 'Extra Drift', blurb: '+5 moves mid-flight', price: 120, currency: 'coins', minSector: 1, preview: 'stripe' },
  { id: 'booster-striped', kind: 'striped', name: 'Striped Star', blurb: 'Drop a striped superstar onto the board', price: 80, currency: 'coins', minSector: 1, preview: 'stripe' },
  { id: 'booster-wrapped', kind: 'wrapped', name: 'Wrapped Star', blurb: 'A supernova shell waiting to bloom', price: 110, currency: 'coins', minSector: 2, preview: 'wrap' },
  { id: 'booster-nova', kind: 'color-bomb', name: 'Color Nova', blurb: 'Board-wide color collapse', price: 180, currency: 'stardust', minSector: 2, preview: 'nova' },
  { id: 'hammer', kind: 'hammer', name: 'Meteor Hammer', blurb: 'Shatter one tile on command', price: 70, currency: 'coins', minSector: 1, preview: 'hammer' },
  { id: 'color-splash', kind: 'color-splash', name: 'Color Splash', blurb: 'Repaint standard stars to one hue', price: 150, currency: 'stardust', minSector: 3, preview: 'splash' },
  { id: 'skin-aurora', kind: 'skin', name: 'Aurora Skin', blurb: 'Iridescent corona on every star', price: 240, currency: 'stardust', minSector: 2, preview: 'skin', payload: 'aurora' },
  { id: 'skin-void', kind: 'skin', name: 'Void Gilt', blurb: 'Obsidian cores with gold fire', price: 320, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'void' },
  { id: 'nebula-boost', kind: 'nebula-booster', name: 'Nebula Booster', blurb: 'First-move cascade insurance', price: 200, currency: 'stardust', minSector: 3, preview: 'nebula' },
  { id: 'streak-shield', kind: 'streak-shield', name: 'Streak Shield', blurb: 'Protect your combo streak on a miss', price: 160, currency: 'coins', minSector: 2, preview: 'shield' },
]

export const SKINS = [
  { id: 'nova-gold', name: 'Nova Gold', minSector: 1 },
  { id: 'aurora', name: 'Aurora', minSector: 2 },
  { id: 'void', name: 'Void Gilt', minSector: 4 },
]

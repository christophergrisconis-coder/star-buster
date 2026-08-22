export type StoreKind =
  | 'lives'
  | 'moves'
  | 'orbit-time'
  | 'striped'
  | 'wrapped'
  | 'color-bomb'
  | 'hammer'
  | 'color-splash'
  | 'skin'
  | 'nebula-booster'
  | 'ion-wake-shield'
  | 'challenge-reroll'
  | 'nebula-skip'
  | 'bundle'

export interface StoreItem {
  id: string
  kind: StoreKind
  name: string
  blurb: string
  price: number
  currency: 'coins' | 'stardust'
  minSector: number
  preview: 'life' | 'stripe' | 'wrap' | 'nova' | 'hammer' | 'splash' | 'skin' | 'shield' | 'nebula' | 'orbit' | 'reroll' | 'skip' | 'bundle'
  payload?: string
  qty?: number
  grants?: Record<string, number>
  hidden?: boolean
  kit?: 'flare' | 'hammer' | 'well' | 'moves' | 'orbit' | 'splash' | 'shield' | 'shuffle'
}

export const STORE_CATALOG: StoreItem[] = [
  { id: 'life-pack', kind: 'lives', name: 'Pulse Pack', blurb: 'Refill 5 voyage lives', price: 90, currency: 'coins', minSector: 1, preview: 'life', qty: 5 },
  { id: 'life-flare', kind: 'lives', name: 'Solar Flare Lives', blurb: 'Eight lives — pricey, but the well is deep', price: 200, currency: 'coins', minSector: 2, preview: 'life', qty: 8 },
  { id: 'moves-5', kind: 'moves', name: 'Extra Drift', blurb: '+5 moves mid-flight', price: 120, currency: 'coins', minSector: 1, preview: 'stripe', kit: 'moves' },
  { id: 'orbit-time', kind: 'orbit-time', name: 'Extra Orbit Time', blurb: '+20s on the orbit clock. Buy time, spend nerve', price: 140, currency: 'coins', minSector: 1, preview: 'orbit', kit: 'orbit' },
  { id: 'orbit-time-deep', kind: 'orbit-time', name: 'Deep Clock', blurb: '+35s — a long burn for high-risk clears', price: 260, currency: 'stardust', minSector: 3, preview: 'orbit', kit: 'orbit' },
  { id: 'solar-flare', kind: 'wrapped', name: 'Solar Flare', blurb: 'Place a sun and ignite a 5×5 burst', price: 90, currency: 'coins', minSector: 1, preview: 'wrap', kit: 'flare' },
  { id: 'booster-striped', kind: 'striped', name: 'Solar Flare', blurb: 'Legacy flare id', price: 80, currency: 'coins', minSector: 1, preview: 'stripe', grants: { 'solar-flare': 1 }, hidden: true },
  { id: 'booster-wrapped', kind: 'wrapped', name: 'Solar Flare Pack', blurb: 'Legacy flare pack', price: 110, currency: 'coins', minSector: 1, preview: 'wrap', grants: { 'solar-flare': 2 }, hidden: true },
  { id: 'booster-nova', kind: 'color-bomb', name: 'Twin Flares', blurb: 'Legacy flare pack', price: 180, currency: 'stardust', minSector: 2, preview: 'nova', grants: { 'solar-flare': 3 }, hidden: true },
  { id: 'hammer', kind: 'hammer', name: 'Meteor Hammer', blurb: 'Shatter one tile on command', price: 70, currency: 'coins', minSector: 1, preview: 'hammer', kit: 'hammer' },
  { id: 'gravity-well', kind: 'hammer', name: 'Gravity Well', blurb: 'Crush a 3×3 pocket. Unlocks in sector 2', price: 130, currency: 'coins', minSector: 2, preview: 'hammer', kit: 'well' },
  { id: 'color-splash', kind: 'color-splash', name: 'Color Splash', blurb: 'Repaint standard stars to one hue', price: 150, currency: 'stardust', minSector: 3, preview: 'splash', kit: 'splash' },
  { id: 'star-shuffle', kind: 'nebula-booster', name: 'Sky Remix', blurb: 'Shuffle the board. Unlocks in sector 4', price: 210, currency: 'stardust', minSector: 4, preview: 'nebula', kit: 'shuffle' },
  { id: 'freeze-orbit', kind: 'orbit-time', name: 'Freeze Orbit', blurb: '+25s on the clock. Deep-sector hold', price: 200, currency: 'stardust', minSector: 4, preview: 'orbit', kit: 'orbit' },
  { id: 'ion-wake-shield', kind: 'ion-wake-shield', name: 'Ion Wake Shield', blurb: 'Protect your Comet Tail if a chain goes cold', price: 160, currency: 'coins', minSector: 2, preview: 'shield', kit: 'shield' },
  { id: 'comet-tail-shield', kind: 'ion-wake-shield', name: 'Comet Tail Shield', blurb: 'Absorb one Comet Tail decay. Risk cheaper than a lost streak', price: 220, currency: 'stardust', minSector: 2, preview: 'shield', kit: 'shield' },
  { id: 'challenge-reroll', kind: 'challenge-reroll', name: 'Challenge Reroll', blurb: 'Reroll high-risk variants on an unlocked nebula', price: 90, currency: 'stardust', minSector: 1, preview: 'reroll' },
  { id: 'nebula-skip', kind: 'nebula-skip', name: 'Nebula Skip Ticket', blurb: 'Skip one unlocked stage. Cannot open locked sectors', price: 340, currency: 'stardust', minSector: 2, preview: 'skip' },
  { id: 'stack-stripes', kind: 'bundle', name: 'Flare Stack', blurb: 'Three solar flares, stacked for a brutal orbit', price: 210, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'solar-flare': 3 } },
  { id: 'stack-shells', kind: 'bundle', name: 'Sun Stack', blurb: 'Five flares. High burn, high payout', price: 380, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'solar-flare': 5 } },
  { id: 'stack-kit', kind: 'bundle', name: 'Pilot Kit', blurb: 'Meteor, flare, splash — a full belt', price: 290, currency: 'coins', minSector: 2, preview: 'bundle', grants: { hammer: 2, 'solar-flare': 1, 'color-splash': 1 } },
  { id: 'nebula-boost', kind: 'nebula-booster', name: 'Nebula Booster', blurb: 'First-move cascade insurance', price: 200, currency: 'stardust', minSector: 3, preview: 'nebula' },
  { id: 'skin-aurora', kind: 'skin', name: 'Aurora Skin', blurb: 'Iridescent corona on every star', price: 240, currency: 'stardust', minSector: 2, preview: 'skin', payload: 'aurora' },
  { id: 'skin-void', kind: 'skin', name: 'Void Gilt', blurb: 'Obsidian cores with gold fire', price: 320, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'void' },
  { id: 'skin-pulsar', kind: 'skin', name: 'Pulsar Cyan', blurb: 'Cosmic skin — cold fire along every edge', price: 280, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'pulsar' },
  { id: 'skin-eclipse', kind: 'skin', name: 'Eclipse Rose', blurb: 'Umbra petals. A showy risk for late sectors', price: 400, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'eclipse' },
  { id: 'skin-meteor', kind: 'skin', name: 'Meteor Iron', blurb: 'Forged trail skin. Cheap swagger for Novice', price: 160, currency: 'coins', minSector: 1, preview: 'skin', payload: 'meteor' },
]

export const SKINS = [
  { id: 'nova-gold', name: 'Nova Gold', minSector: 1 },
  { id: 'aurora', name: 'Aurora', minSector: 2 },
  { id: 'void', name: 'Void Gilt', minSector: 4 },
  { id: 'pulsar', name: 'Pulsar Cyan', minSector: 3 },
  { id: 'eclipse', name: 'Eclipse Rose', minSector: 4 },
  { id: 'meteor', name: 'Meteor Iron', minSector: 1 },
]

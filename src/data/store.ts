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

export type StorePreview =
  | 'life'
  | 'stripe'
  | 'wrap'
  | 'nova'
  | 'hammer'
  | 'splash'
  | 'skin'
  | 'shield'
  | 'nebula'
  | 'orbit'
  | 'reroll'
  | 'skip'
  | 'bundle'

export interface StoreItem {
  id: string
  kind: StoreKind
  name: string
  blurb: string
  price: number
  currency: 'coins' | 'stardust'
  minSector: number
  preview: StorePreview
  payload?: string
  qty?: number
  grants?: Record<string, number>
  hidden?: boolean
  kit?: 'flare' | 'hammer' | 'well' | 'moves' | 'orbit' | 'splash' | 'shield' | 'shuffle'
}

const CORE: StoreItem[] = [
  { id: 'life-pack', kind: 'lives', name: 'Pulse Pack', blurb: 'Refill 5 voyage lives', price: 90, currency: 'coins', minSector: 1, preview: 'life', qty: 5 },
  { id: 'life-flare', kind: 'lives', name: 'Solar Flare Lives', blurb: 'Eight lives — pricey, but the well is deep', price: 200, currency: 'coins', minSector: 2, preview: 'life', qty: 8 },
  { id: 'moves-5', kind: 'moves', name: 'Extra Drift', blurb: '+5 moves mid-flight', price: 120, currency: 'coins', minSector: 1, preview: 'stripe', kit: 'moves' },
  { id: 'orbit-time', kind: 'orbit-time', name: 'Extra Orbit Time', blurb: '+20s on the orbit clock. Buy time, spend nerve', price: 140, currency: 'coins', minSector: 1, preview: 'orbit', kit: 'orbit' },
  { id: 'orbit-time-deep', kind: 'orbit-time', name: 'Deep Clock', blurb: '+35s — a long burn for high-risk clears', price: 260, currency: 'stardust', minSector: 3, preview: 'orbit', kit: 'orbit' },
  { id: 'solar-flare', kind: 'wrapped', name: 'Solar Flare', blurb: 'Place a sun and ignite a 3×3 burst', price: 90, currency: 'coins', minSector: 1, preview: 'wrap', kit: 'flare' },
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
  { id: 'nebula-boost', kind: 'nebula-booster', name: 'Nebula Booster', blurb: '+3 moves and +12s after your first burst this orbit', price: 200, currency: 'stardust', minSector: 3, preview: 'nebula' },
  { id: 'skin-aurora', kind: 'skin', name: 'Aurora Skin', blurb: 'Iridescent corona on every star', price: 240, currency: 'stardust', minSector: 2, preview: 'skin', payload: 'aurora' },
  { id: 'skin-void', kind: 'skin', name: 'Void Gilt', blurb: 'Obsidian cores with gold fire', price: 320, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'void' },
  { id: 'skin-pulsar', kind: 'skin', name: 'Pulsar Cyan', blurb: 'Cosmic skin — cold fire along every edge', price: 280, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'pulsar' },
  { id: 'skin-eclipse', kind: 'skin', name: 'Eclipse Rose', blurb: 'Umbra petals. A showy risk for late sectors', price: 400, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'eclipse' },
  { id: 'skin-meteor', kind: 'skin', name: 'Meteor Iron', blurb: 'Forged trail skin. Cheap swagger for Novice', price: 160, currency: 'coins', minSector: 1, preview: 'skin', payload: 'meteor' },
  { id: 'life-crate', kind: 'lives', name: 'Life Crate', blurb: 'Twelve lives for a long nebula run', price: 280, currency: 'coins', minSector: 2, preview: 'life', qty: 12 },
  { id: 'life-vault', kind: 'lives', name: 'Pulse Vault', blurb: 'Twenty lives. Deep-sector insurance', price: 420, currency: 'stardust', minSector: 4, preview: 'life', qty: 20 },
  { id: 'moves-3', kind: 'moves', name: 'Short Drift', blurb: 'One fuel charge when the well is tight', price: 70, currency: 'coins', minSector: 1, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 1 } },
  { id: 'moves-8', kind: 'moves', name: 'Long Drift', blurb: 'Two fuel charges for a brutal cluster', price: 190, currency: 'coins', minSector: 2, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 2 } },
  { id: 'moves-12', kind: 'moves', name: 'Burn Reserve', blurb: 'Three fuel charges. Late-sector dump', price: 310, currency: 'stardust', minSector: 4, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 3 } },
  { id: 'orbit-sip', kind: 'orbit-time', name: 'Clock Sip', blurb: 'One orbit clock charge. A breath, not a rescue', price: 80, currency: 'coins', minSector: 1, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time': 1 } },
  { id: 'orbit-hold', kind: 'orbit-time', name: 'Clock Hold', blurb: 'Two deep-clock charges for a high-risk variant', price: 300, currency: 'stardust', minSector: 3, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time-deep': 2 } },
  { id: 'solar-flare-2', kind: 'wrapped', name: 'Twin Suns', blurb: 'Two flares, ready to plant', price: 160, currency: 'coins', minSector: 1, preview: 'wrap', grants: { 'solar-flare': 2 } },
  { id: 'solar-flare-4', kind: 'wrapped', name: 'Flare Quartet', blurb: 'Four suns for a sealed cluster', price: 300, currency: 'coins', minSector: 2, preview: 'wrap', grants: { 'solar-flare': 4 } },
  { id: 'hammer-3', kind: 'hammer', name: 'Meteor Trio', blurb: 'Three hammers. Chip the lattice', price: 180, currency: 'coins', minSector: 1, preview: 'hammer', grants: { hammer: 3 } },
  { id: 'hammer-deep', kind: 'hammer', name: 'Iron Meteor', blurb: 'A heavier hammer charge for sector 3', price: 150, currency: 'stardust', minSector: 3, preview: 'hammer', kit: 'hammer', grants: { hammer: 1 } },
  { id: 'well-2', kind: 'hammer', name: 'Twin Wells', blurb: 'Two gravity wells', price: 230, currency: 'coins', minSector: 2, preview: 'hammer', grants: { 'gravity-well': 2 } },
  { id: 'splash-2', kind: 'color-splash', name: 'Double Splash', blurb: 'Two repaints for stubborn hues', price: 260, currency: 'stardust', minSector: 3, preview: 'splash', grants: { 'color-splash': 2 } },
  { id: 'remix-2', kind: 'nebula-booster', name: 'Double Remix', blurb: 'Two shuffles when the sky locks', price: 360, currency: 'stardust', minSector: 4, preview: 'nebula', grants: { 'star-shuffle': 2 } },
  { id: 'shield-2', kind: 'ion-wake-shield', name: 'Wake Pair', blurb: 'Two ion shields for a comet run', price: 280, currency: 'coins', minSector: 2, preview: 'shield', grants: { 'ion-wake-shield': 2 } },
  { id: 'reroll-3', kind: 'challenge-reroll', name: 'Reroll Pack', blurb: 'Three challenge rerolls', price: 220, currency: 'stardust', minSector: 2, preview: 'reroll', grants: { 'challenge-reroll': 3 } },
  { id: 'skip-2', kind: 'nebula-skip', name: 'Skip Pair', blurb: 'Two skip tickets. Still cannot open locked sectors', price: 600, currency: 'stardust', minSector: 3, preview: 'skip', grants: { 'nebula-skip': 2 } },
  { id: 'bundle-novice', kind: 'bundle', name: 'Novice Belt', blurb: 'Flare and hammer — first-world kit', price: 180, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'solar-flare': 1, hammer: 1, 'moves-5': 1 } },
  { id: 'bundle-veil', kind: 'bundle', name: 'Veil Kit', blurb: 'Fuel, clock, and a flare for Amber runs', price: 240, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'moves-5': 2, 'orbit-time': 1, 'solar-flare': 1 } },
  { id: 'bundle-warden', kind: 'bundle', name: 'Warden Belt', blurb: 'Well, shield, and hammer for bloom worlds', price: 340, currency: 'coins', minSector: 2, preview: 'bundle', grants: { 'gravity-well': 1, 'ion-wake-shield': 1, hammer: 2 } },
  { id: 'bundle-forge', kind: 'bundle', name: 'Forge Crate', blurb: 'Flares and wells for the late fire sectors', price: 460, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'solar-flare': 3, 'gravity-well': 2 } },
  { id: 'bundle-abyss', kind: 'bundle', name: 'Abyss Case', blurb: 'Clock, remix, splash — last-light tools', price: 540, currency: 'stardust', minSector: 4, preview: 'bundle', grants: { 'freeze-orbit': 1, 'star-shuffle': 1, 'color-splash': 1 } },
  { id: 'bundle-omega', kind: 'bundle', name: 'Omega Cache', blurb: 'A full late-voyage belt', price: 720, currency: 'stardust', minSector: 5, preview: 'bundle', grants: { 'solar-flare': 4, hammer: 2, 'star-shuffle': 1, 'ion-wake-shield': 1 } },
  { id: 'nebula-boost-2', kind: 'nebula-booster', name: 'Cascade Pair', blurb: 'Two nebula boosts — +3 moves and +12s after the first burst', price: 340, currency: 'stardust', minSector: 3, preview: 'nebula', grants: { 'nebula-boost': 2 } },
  { id: 'skin-helium', kind: 'skin', name: 'Helium Veil', blurb: 'Pale gold wash for early worlds', price: 140, currency: 'coins', minSector: 1, preview: 'skin', payload: 'helium' },
  { id: 'skin-ion', kind: 'skin', name: 'Ion Teal', blurb: 'Cold current along every star', price: 220, currency: 'coins', minSector: 2, preview: 'skin', payload: 'ion' },
  { id: 'skin-ember', kind: 'skin', name: 'Ember Lattice', blurb: 'Forge-hot edges for sector 3', price: 300, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'ember' },
  { id: 'skin-null', kind: 'skin', name: 'Null Shear', blurb: 'Almost no light. Late swagger', price: 380, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'null' },
  { id: 'skin-horizon', kind: 'skin', name: 'Horizon Heart', blurb: 'Last-light gilt. Omega only', price: 460, currency: 'stardust', minSector: 5, preview: 'skin', payload: 'horizon' },
]

const EXPANSION: StoreItem[] = [
  { id: 'life-sip', kind: 'lives', name: 'Pulse Sip', blurb: 'Two lives. Cheap, thin, enough to retry', price: 40, currency: 'coins', minSector: 1, preview: 'life', qty: 2 },
  { id: 'life-trio', kind: 'lives', name: 'Pulse Trio', blurb: 'Three lives for a short Amber run', price: 60, currency: 'coins', minSector: 1, preview: 'life', qty: 3 },
  { id: 'life-seven', kind: 'lives', name: 'Sevenfold Pulse', blurb: 'Seven lives. Odd number, even luck', price: 150, currency: 'coins', minSector: 1, preview: 'life', qty: 7 },
  { id: 'life-ten', kind: 'lives', name: 'Decade Pulse', blurb: 'Ten lives for a full nebula', price: 230, currency: 'coins', minSector: 2, preview: 'life', qty: 10 },
  { id: 'life-fifteen', kind: 'lives', name: 'Tide of Lives', blurb: 'Fifteen lives. Veteran insurance', price: 340, currency: 'coins', minSector: 3, preview: 'life', qty: 15 },
  { id: 'life-twentyfour', kind: 'lives', name: 'Daycycle Vault', blurb: 'Twenty-four lives. A full clock of retries', price: 480, currency: 'stardust', minSector: 4, preview: 'life', qty: 24 },
  { id: 'life-omega', kind: 'lives', name: 'Horizon Well', blurb: 'Forty lives. Event Horizon only', price: 760, currency: 'stardust', minSector: 5, preview: 'life', qty: 40 },
  { id: 'life-dust-five', kind: 'lives', name: 'Dust Pulse', blurb: 'Five lives paid in stardust', price: 70, currency: 'stardust', minSector: 1, preview: 'life', qty: 5 },
  { id: 'life-dust-twelve', kind: 'lives', name: 'Dust Crate', blurb: 'Twelve lives, no coin spend', price: 160, currency: 'stardust', minSector: 2, preview: 'life', qty: 12 },

  { id: 'solar-flare-3', kind: 'wrapped', name: 'Triple Sun', blurb: 'Three flares. Plant, wait, ignite', price: 240, currency: 'coins', minSector: 1, preview: 'wrap', kit: 'flare', grants: { 'solar-flare': 3 } },
  { id: 'solar-flare-6', kind: 'wrapped', name: 'Hex Sun', blurb: 'Six flares for a sealed cluster', price: 420, currency: 'coins', minSector: 2, preview: 'wrap', grants: { 'solar-flare': 6 } },
  { id: 'solar-flare-8', kind: 'wrapped', name: 'Octet Flare', blurb: 'Eight suns. Veteran burn stock', price: 520, currency: 'stardust', minSector: 3, preview: 'wrap', grants: { 'solar-flare': 8 } },
  { id: 'solar-flare-10', kind: 'wrapped', name: 'Deca Flare', blurb: 'Ten flares. Elite orbit fuel', price: 640, currency: 'stardust', minSector: 4, preview: 'wrap', grants: { 'solar-flare': 10 } },
  { id: 'solar-flare-16', kind: 'wrapped', name: 'Corona Cache', blurb: 'Sixteen flares. Horizon swagger', price: 880, currency: 'stardust', minSector: 5, preview: 'wrap', grants: { 'solar-flare': 16 } },
  { id: 'solar-flare-dust', kind: 'wrapped', name: 'Dust Sun', blurb: 'One flare, paid in stardust', price: 55, currency: 'stardust', minSector: 1, preview: 'wrap', kit: 'flare', grants: { 'solar-flare': 1 } },

  { id: 'hammer-2', kind: 'hammer', name: 'Meteor Pair', blurb: 'Two hammers. Chip twice', price: 120, currency: 'coins', minSector: 1, preview: 'hammer', kit: 'hammer', grants: { hammer: 2 } },
  { id: 'hammer-5', kind: 'hammer', name: 'Meteor Five', blurb: 'Five hammers for a stubborn lattice', price: 280, currency: 'coins', minSector: 2, preview: 'hammer', grants: { hammer: 5 } },
  { id: 'hammer-8', kind: 'hammer', name: 'Iron Rain', blurb: 'Eight hammers. Veteran chisel', price: 360, currency: 'stardust', minSector: 3, preview: 'hammer', grants: { hammer: 8 } },
  { id: 'hammer-12', kind: 'hammer', name: 'Meteor Magazine', blurb: 'Twelve hammers. Elite demolition', price: 480, currency: 'stardust', minSector: 4, preview: 'hammer', grants: { hammer: 12 } },
  { id: 'hammer-dust', kind: 'hammer', name: 'Dust Meteor', blurb: 'One hammer, paid in stardust', price: 45, currency: 'stardust', minSector: 1, preview: 'hammer', kit: 'hammer', grants: { hammer: 1 } },
  { id: 'well-1-dust', kind: 'hammer', name: 'Dust Well', blurb: 'One gravity well, paid in stardust', price: 90, currency: 'stardust', minSector: 2, preview: 'hammer', kit: 'well', grants: { 'gravity-well': 1 } },
  { id: 'well-3', kind: 'hammer', name: 'Triple Well', blurb: 'Three wells. Crush three pockets', price: 330, currency: 'coins', minSector: 2, preview: 'hammer', kit: 'well', grants: { 'gravity-well': 3 } },
  { id: 'well-5', kind: 'hammer', name: 'Well Rack', blurb: 'Five wells for bloom worlds', price: 420, currency: 'stardust', minSector: 3, preview: 'hammer', grants: { 'gravity-well': 5 } },
  { id: 'well-8', kind: 'hammer', name: 'Singularity Case', blurb: 'Eight wells. Horizon crush stock', price: 620, currency: 'stardust', minSector: 5, preview: 'hammer', grants: { 'gravity-well': 8 } },

  { id: 'moves-pair', kind: 'moves', name: 'Drift Pair', blurb: 'Two fuel charges', price: 210, currency: 'coins', minSector: 1, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 2 } },
  { id: 'moves-rack', kind: 'moves', name: 'Fuel Rack', blurb: 'Four fuel charges', price: 380, currency: 'coins', minSector: 2, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 4 } },
  { id: 'moves-hold', kind: 'moves', name: 'Fuel Hold', blurb: 'Six fuel charges for Gravity Veteran', price: 440, currency: 'stardust', minSector: 3, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 6 } },
  { id: 'moves-omega', kind: 'moves', name: 'Horizon Fuel', blurb: 'Eight fuel charges. Nothing left in the tank is a choice', price: 580, currency: 'stardust', minSector: 5, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 8 } },
  { id: 'moves-dust', kind: 'moves', name: 'Dust Drift', blurb: 'One fuel charge, paid in stardust', price: 75, currency: 'stardust', minSector: 1, preview: 'stripe', kit: 'moves', grants: { 'moves-5': 1 } },

  { id: 'orbit-pair', kind: 'orbit-time', name: 'Clock Pair', blurb: 'Two +20s clock charges', price: 250, currency: 'coins', minSector: 1, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time': 2 } },
  { id: 'orbit-rack', kind: 'orbit-time', name: 'Clock Rack', blurb: 'Four +20s clock charges', price: 460, currency: 'coins', minSector: 2, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time': 4 } },
  { id: 'orbit-deep-2', kind: 'orbit-time', name: 'Deep Pair', blurb: 'Two +35s deep clocks', price: 460, currency: 'stardust', minSector: 3, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time-deep': 2 } },
  { id: 'orbit-deep-4', kind: 'orbit-time', name: 'Deep Rack', blurb: 'Four deep clocks for Elite lanes', price: 820, currency: 'stardust', minSector: 4, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time-deep': 4 } },
  { id: 'freeze-2', kind: 'orbit-time', name: 'Freeze Pair', blurb: 'Two freeze-orbit charges', price: 360, currency: 'stardust', minSector: 4, preview: 'orbit', kit: 'orbit', grants: { 'freeze-orbit': 2 } },
  { id: 'freeze-4', kind: 'orbit-time', name: 'Ice Magazine', blurb: 'Four freeze-orbit charges', price: 640, currency: 'stardust', minSector: 5, preview: 'orbit', kit: 'orbit', grants: { 'freeze-orbit': 4 } },
  { id: 'orbit-dust', kind: 'orbit-time', name: 'Dust Clock', blurb: 'One +20s charge, paid in stardust', price: 85, currency: 'stardust', minSector: 1, preview: 'orbit', kit: 'orbit', grants: { 'orbit-time': 1 } },

  { id: 'splash-1-coin', kind: 'color-splash', name: 'Coin Splash', blurb: 'One repaint, paid in coins', price: 220, currency: 'coins', minSector: 3, preview: 'splash', kit: 'splash', grants: { 'color-splash': 1 } },
  { id: 'splash-3', kind: 'color-splash', name: 'Splash Trio', blurb: 'Three repaints for stubborn hues', price: 380, currency: 'stardust', minSector: 3, preview: 'splash', kit: 'splash', grants: { 'color-splash': 3 } },
  { id: 'splash-5', kind: 'color-splash', name: 'Pigment Rack', blurb: 'Five splashes. Elite hue control', price: 580, currency: 'stardust', minSector: 4, preview: 'splash', grants: { 'color-splash': 5 } },
  { id: 'splash-8', kind: 'color-splash', name: 'Chroma Vault', blurb: 'Eight splashes. Horizon palette', price: 820, currency: 'stardust', minSector: 5, preview: 'splash', grants: { 'color-splash': 8 } },

  { id: 'remix-1-coin', kind: 'nebula-booster', name: 'Coin Remix', blurb: 'One shuffle, paid in coins', price: 280, currency: 'coins', minSector: 4, preview: 'nebula', kit: 'shuffle', grants: { 'star-shuffle': 1 } },
  { id: 'remix-3', kind: 'nebula-booster', name: 'Remix Trio', blurb: 'Three shuffles when the sky locks', price: 520, currency: 'stardust', minSector: 4, preview: 'nebula', kit: 'shuffle', grants: { 'star-shuffle': 3 } },
  { id: 'remix-5', kind: 'nebula-booster', name: 'Sky Magazine', blurb: 'Five shuffles. Elite scramble', price: 780, currency: 'stardust', minSector: 5, preview: 'nebula', grants: { 'star-shuffle': 5 } },
  { id: 'nebula-boost-3', kind: 'nebula-booster', name: 'Cascade Trio', blurb: 'Three nebula boosts after the first burst', price: 480, currency: 'stardust', minSector: 3, preview: 'nebula', grants: { 'nebula-boost': 3 } },
  { id: 'nebula-boost-5', kind: 'nebula-booster', name: 'Cascade Rack', blurb: 'Five nebula boosts. Veteran cascade bait', price: 740, currency: 'stardust', minSector: 4, preview: 'nebula', grants: { 'nebula-boost': 5 } },
  { id: 'nebula-boost-coin', kind: 'nebula-booster', name: 'Coin Cascade', blurb: 'One nebula boost, paid in coins', price: 280, currency: 'coins', minSector: 3, preview: 'nebula', grants: { 'nebula-boost': 1 } },

  { id: 'shield-3', kind: 'ion-wake-shield', name: 'Wake Trio', blurb: 'Three ion shields', price: 390, currency: 'coins', minSector: 2, preview: 'shield', kit: 'shield', grants: { 'ion-wake-shield': 3 } },
  { id: 'shield-5', kind: 'ion-wake-shield', name: 'Wake Rack', blurb: 'Five ion shields for comet runs', price: 480, currency: 'stardust', minSector: 3, preview: 'shield', grants: { 'ion-wake-shield': 5 } },
  { id: 'shield-8', kind: 'ion-wake-shield', name: 'Comet Armory', blurb: 'Eight ion shields. Horizon insurance', price: 700, currency: 'stardust', minSector: 5, preview: 'shield', grants: { 'ion-wake-shield': 8 } },
  { id: 'comet-2', kind: 'ion-wake-shield', name: 'Comet Pair', blurb: 'Two comet-tail shields', price: 380, currency: 'stardust', minSector: 2, preview: 'shield', kit: 'shield', grants: { 'comet-tail-shield': 2 } },
  { id: 'comet-4', kind: 'ion-wake-shield', name: 'Comet Rack', blurb: 'Four comet-tail shields', price: 680, currency: 'stardust', minSector: 4, preview: 'shield', grants: { 'comet-tail-shield': 4 } },

  { id: 'reroll-1-coin', kind: 'challenge-reroll', name: 'Coin Reroll', blurb: 'One challenge reroll, paid in coins', price: 140, currency: 'coins', minSector: 1, preview: 'reroll', grants: { 'challenge-reroll': 1 } },
  { id: 'reroll-2', kind: 'challenge-reroll', name: 'Reroll Pair', blurb: 'Two challenge rerolls', price: 160, currency: 'stardust', minSector: 1, preview: 'reroll', grants: { 'challenge-reroll': 2 } },
  { id: 'reroll-5', kind: 'challenge-reroll', name: 'Reroll Rack', blurb: 'Five rerolls for a stubborn nebula', price: 340, currency: 'stardust', minSector: 2, preview: 'reroll', grants: { 'challenge-reroll': 5 } },
  { id: 'reroll-8', kind: 'challenge-reroll', name: 'Fate Magazine', blurb: 'Eight rerolls. Elite variant hunting', price: 500, currency: 'stardust', minSector: 4, preview: 'reroll', grants: { 'challenge-reroll': 8 } },
  { id: 'skip-1-coin', kind: 'nebula-skip', name: 'Coin Skip', blurb: 'One skip ticket, paid in coins', price: 480, currency: 'coins', minSector: 2, preview: 'skip', grants: { 'nebula-skip': 1 } },
  { id: 'skip-3', kind: 'nebula-skip', name: 'Skip Trio', blurb: 'Three skip tickets. Still cannot open locked sectors', price: 860, currency: 'stardust', minSector: 3, preview: 'skip', grants: { 'nebula-skip': 3 } },
  { id: 'skip-5', kind: 'nebula-skip', name: 'Lane Pass', blurb: 'Five skip tickets for Elite lanes', price: 1280, currency: 'stardust', minSector: 4, preview: 'skip', grants: { 'nebula-skip': 5 } },

  { id: 'bundle-amber', kind: 'bundle', name: 'Amber Case', blurb: 'Flare, fuel, and a sip of clock for Helios Drift', price: 260, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'solar-flare': 2, 'moves-5': 1, 'orbit-time': 1 } },
  { id: 'bundle-coral', kind: 'bundle', name: 'Coral Belt', blurb: 'Hammers and a flare for Coral Drift', price: 220, currency: 'coins', minSector: 1, preview: 'bundle', grants: { hammer: 3, 'solar-flare': 1 } },
  { id: 'bundle-violet', kind: 'bundle', name: 'Violet Satchel', blurb: 'Clock pair and a reroll for Violet Mist', price: 300, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'orbit-time': 2, 'challenge-reroll': 1 } },
  { id: 'bundle-bloom', kind: 'bundle', name: 'Bloom Crate', blurb: 'Well, splash, and flare for sector 2 bloom', price: 410, currency: 'coins', minSector: 2, preview: 'bundle', grants: { 'gravity-well': 1, 'color-splash': 1, 'solar-flare': 2 } },
  { id: 'bundle-comet', kind: 'bundle', name: 'Comet Belt', blurb: 'Wake shields and fuel for tail runs', price: 390, currency: 'coins', minSector: 2, preview: 'bundle', grants: { 'ion-wake-shield': 2, 'comet-tail-shield': 1, 'moves-5': 1 } },
  { id: 'bundle-adept', kind: 'bundle', name: 'Adept Rack', blurb: 'Hammers, wells, and a skip for Orbit Adept', price: 520, currency: 'coins', minSector: 2, preview: 'bundle', grants: { hammer: 3, 'gravity-well': 1, 'nebula-skip': 1 } },
  { id: 'bundle-veteran', kind: 'bundle', name: 'Veteran Case', blurb: 'Deep clock, splash, and flares', price: 580, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'orbit-time-deep': 1, 'color-splash': 2, 'solar-flare': 3 } },
  { id: 'bundle-gravity', kind: 'bundle', name: 'Gravity Trunk', blurb: 'Wells and hammers. Crush, then chip', price: 540, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'gravity-well': 3, hammer: 4 } },
  { id: 'bundle-cascade', kind: 'bundle', name: 'Cascade Trunk', blurb: 'Nebula boosts plus fuel', price: 520, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'nebula-boost': 2, 'moves-5': 2 } },
  { id: 'bundle-elite', kind: 'bundle', name: 'Elite Satchel', blurb: 'Remix, freeze, and flares for Supernova lanes', price: 680, currency: 'stardust', minSector: 4, preview: 'bundle', grants: { 'star-shuffle': 2, 'freeze-orbit': 1, 'solar-flare': 4 } },
  { id: 'bundle-shock', kind: 'bundle', name: 'Shock Crate', blurb: 'Skip, reroll, and a well when the variant is cruel', price: 760, currency: 'stardust', minSector: 4, preview: 'bundle', grants: { 'nebula-skip': 1, 'challenge-reroll': 3, 'gravity-well': 2 } },
  { id: 'bundle-horizon', kind: 'bundle', name: 'Horizon Trunk', blurb: 'Full kit dump for Event Horizon', price: 980, currency: 'stardust', minSector: 5, preview: 'bundle', grants: { 'solar-flare': 6, hammer: 4, 'gravity-well': 2, 'star-shuffle': 2, 'ion-wake-shield': 2 } },
  { id: 'bundle-lastlight', kind: 'bundle', name: 'Last Light Case', blurb: 'Splash, freeze, remix, and a skip', price: 920, currency: 'stardust', minSector: 5, preview: 'bundle', grants: { 'color-splash': 3, 'freeze-orbit': 2, 'star-shuffle': 2, 'nebula-skip': 1 } },
  { id: 'bundle-starter-plus', kind: 'bundle', name: 'Novice Plus', blurb: 'Two flares, two hammers, two fuel', price: 320, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'solar-flare': 2, hammer: 2, 'moves-5': 2 } },
  { id: 'bundle-clockwork', kind: 'bundle', name: 'Clockwork Belt', blurb: 'Clocks only — four charges of nerve', price: 360, currency: 'coins', minSector: 1, preview: 'bundle', grants: { 'orbit-time': 4 } },
  { id: 'bundle-sunbelt', kind: 'bundle', name: 'Sun Belt', blurb: 'Flares only — seven suns, no filler', price: 480, currency: 'coins', minSector: 2, preview: 'bundle', grants: { 'solar-flare': 7 } },
  { id: 'bundle-mason', kind: 'bundle', name: 'Mason Belt', blurb: 'Hammers only — nine chips', price: 420, currency: 'coins', minSector: 2, preview: 'bundle', grants: { hammer: 9 } },
  { id: 'bundle-wake', kind: 'bundle', name: 'Wake Case', blurb: 'Ion and comet shields, stacked', price: 540, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'ion-wake-shield': 3, 'comet-tail-shield': 2 } },
  { id: 'bundle-fate', kind: 'bundle', name: 'Fate Case', blurb: 'Rerolls and a skip for hunting variants', price: 620, currency: 'stardust', minSector: 3, preview: 'bundle', grants: { 'challenge-reroll': 5, 'nebula-skip': 1 } },

  { id: 'skin-comet', kind: 'skin', name: 'Comet Trail', blurb: 'Warm streak along every edge', price: 180, currency: 'coins', minSector: 1, preview: 'skin', payload: 'comet' },
  { id: 'skin-frost', kind: 'skin', name: 'Frost Lattice', blurb: 'Cold wash. Novice swagger', price: 170, currency: 'coins', minSector: 1, preview: 'skin', payload: 'frost' },
  { id: 'skin-bronze', kind: 'skin', name: 'Bronze Wake', blurb: 'Old-metal gilt on every star', price: 190, currency: 'coins', minSector: 1, preview: 'skin', payload: 'bronze' },
  { id: 'skin-pearl', kind: 'skin', name: 'Pearl Drift', blurb: 'Soft light. Cheap elegance', price: 200, currency: 'coins', minSector: 1, preview: 'skin', payload: 'pearl' },
  { id: 'skin-plasma', kind: 'skin', name: 'Plasma Veil', blurb: 'Hot current. Adept only', price: 260, currency: 'coins', minSector: 2, preview: 'skin', payload: 'plasma' },
  { id: 'skin-cobalt', kind: 'skin', name: 'Cobalt Shear', blurb: 'Deep blue fire along the corona', price: 250, currency: 'coins', minSector: 2, preview: 'skin', payload: 'cobalt' },
  { id: 'skin-quartz', kind: 'skin', name: 'Quartz Bloom', blurb: 'Pale crystal wash for bloom worlds', price: 270, currency: 'stardust', minSector: 2, preview: 'skin', payload: 'quartz' },
  { id: 'skin-rose', kind: 'skin', name: 'Rose Current', blurb: 'Warm magenta edges', price: 280, currency: 'stardust', minSector: 2, preview: 'skin', payload: 'rose' },
  { id: 'skin-magma', kind: 'skin', name: 'Magma Lattice', blurb: 'Forge-hot cores. Veteran fire', price: 320, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'magma' },
  { id: 'skin-tide', kind: 'skin', name: 'Tide Glass', blurb: 'Green-blue wash like a cold ocean', price: 310, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'tide' },
  { id: 'skin-solar', kind: 'skin', name: 'Solar Cloth', blurb: 'Brighter gold than Nova. Show-off', price: 330, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'solar' },
  { id: 'skin-ink', kind: 'skin', name: 'Ink Corona', blurb: 'Almost black. Veteran quiet', price: 340, currency: 'stardust', minSector: 3, preview: 'skin', payload: 'ink' },
  { id: 'skin-storm', kind: 'skin', name: 'Storm Gilt', blurb: 'Violet shock along every point', price: 390, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'storm' },
  { id: 'skin-glacier', kind: 'skin', name: 'Glacier Edge', blurb: 'Ice-white corona. Elite cold', price: 400, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'glacier' },
  { id: 'skin-prism', kind: 'skin', name: 'Prism Shear', blurb: 'Hue-split swagger for Elite lanes', price: 420, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'prism' },
  { id: 'skin-umbra', kind: 'skin', name: 'Umbra Cloth', blurb: 'Shadowed cores. Late swagger', price: 430, currency: 'stardust', minSector: 4, preview: 'skin', payload: 'umbra' },
  { id: 'skin-analog', kind: 'skin', name: 'Analog Gold', blurb: 'Warm film grain. Horizon only', price: 480, currency: 'stardust', minSector: 5, preview: 'skin', payload: 'analog' },
  { id: 'skin-lynx', kind: 'skin', name: 'Lynx Fire', blurb: 'Sharp amber. Last-light show', price: 500, currency: 'stardust', minSector: 5, preview: 'skin', payload: 'lynx' },
  { id: 'skin-omega', kind: 'skin', name: 'Omega Cloth', blurb: 'The last skin. Event Horizon only', price: 560, currency: 'stardust', minSector: 5, preview: 'skin', payload: 'omega' },
]

export const STORE_CATALOG: StoreItem[] = [...CORE, ...EXPANSION]

export const SKINS = [
  { id: 'nova-gold', name: 'Nova Gold', minSector: 1 },
  { id: 'aurora', name: 'Aurora', minSector: 2 },
  { id: 'void', name: 'Void Gilt', minSector: 4 },
  { id: 'pulsar', name: 'Pulsar Cyan', minSector: 3 },
  { id: 'eclipse', name: 'Eclipse Rose', minSector: 4 },
  { id: 'meteor', name: 'Meteor Iron', minSector: 1 },
  { id: 'helium', name: 'Helium Veil', minSector: 1 },
  { id: 'ion', name: 'Ion Teal', minSector: 2 },
  { id: 'ember', name: 'Ember Lattice', minSector: 3 },
  { id: 'null', name: 'Null Shear', minSector: 4 },
  { id: 'horizon', name: 'Horizon Heart', minSector: 5 },
  { id: 'comet', name: 'Comet Trail', minSector: 1 },
  { id: 'frost', name: 'Frost Lattice', minSector: 1 },
  { id: 'bronze', name: 'Bronze Wake', minSector: 1 },
  { id: 'pearl', name: 'Pearl Drift', minSector: 1 },
  { id: 'plasma', name: 'Plasma Veil', minSector: 2 },
  { id: 'cobalt', name: 'Cobalt Shear', minSector: 2 },
  { id: 'quartz', name: 'Quartz Bloom', minSector: 2 },
  { id: 'rose', name: 'Rose Current', minSector: 2 },
  { id: 'magma', name: 'Magma Lattice', minSector: 3 },
  { id: 'tide', name: 'Tide Glass', minSector: 3 },
  { id: 'solar', name: 'Solar Cloth', minSector: 3 },
  { id: 'ink', name: 'Ink Corona', minSector: 3 },
  { id: 'storm', name: 'Storm Gilt', minSector: 4 },
  { id: 'glacier', name: 'Glacier Edge', minSector: 4 },
  { id: 'prism', name: 'Prism Shear', minSector: 4 },
  { id: 'umbra', name: 'Umbra Cloth', minSector: 4 },
  { id: 'analog', name: 'Analog Gold', minSector: 5 },
  { id: 'lynx', name: 'Lynx Fire', minSector: 5 },
  { id: 'omega', name: 'Omega Cloth', minSector: 5 },
]

export const SKIN_FILTERS: Record<string, string> = {
  aurora: 'hue-rotate(28deg)',
  void: 'saturate(1.4)',
  pulsar: 'hue-rotate(165deg) saturate(1.2)',
  eclipse: 'hue-rotate(-18deg) saturate(1.25)',
  meteor: 'saturate(0.85) contrast(1.15)',
  helium: 'saturate(0.7) brightness(1.08)',
  ion: 'hue-rotate(140deg) saturate(1.15)',
  ember: 'hue-rotate(-12deg) saturate(1.35) contrast(1.1)',
  null: 'saturate(0.35) brightness(0.82)',
  horizon: 'hue-rotate(8deg) saturate(1.3) brightness(1.05)',
  comet: 'hue-rotate(-8deg) saturate(1.2) brightness(1.06)',
  frost: 'hue-rotate(190deg) saturate(0.7) brightness(1.12)',
  bronze: 'sepia(0.45) saturate(1.2)',
  pearl: 'saturate(0.55) brightness(1.14)',
  plasma: 'hue-rotate(48deg) saturate(1.4)',
  cobalt: 'hue-rotate(200deg) saturate(1.25)',
  quartz: 'hue-rotate(280deg) saturate(0.8) brightness(1.1)',
  rose: 'hue-rotate(-30deg) saturate(1.2)',
  magma: 'hue-rotate(-20deg) saturate(1.5) contrast(1.15)',
  tide: 'hue-rotate(120deg) saturate(1.1)',
  solar: 'saturate(1.45) brightness(1.08)',
  ink: 'saturate(0.45) brightness(0.78) contrast(1.2)',
  storm: 'hue-rotate(250deg) saturate(1.3)',
  glacier: 'hue-rotate(175deg) saturate(0.55) brightness(1.16)',
  prism: 'hue-rotate(80deg) saturate(1.45)',
  umbra: 'brightness(0.72) saturate(0.9) contrast(1.2)',
  analog: 'sepia(0.25) saturate(1.15) contrast(1.05)',
  lynx: 'hue-rotate(-6deg) saturate(1.4) contrast(1.12)',
  omega: 'hue-rotate(12deg) saturate(1.55) contrast(1.18)',
}

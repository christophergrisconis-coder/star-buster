import type { LevelConfig } from '~/engine/types'
import { CAMPAIGN } from './campaign'

export type ChallengeId = 'comet-tail' | 'nova-combo' | 'time-bank' | 'no-spread' | 'no-hints'

export type Challenge = {
  id: ChallengeId
  title: string
  blurb: string
  stardust: number
}

export type ChallengeRun = {
  peakCometTail: number
  chocolateSpread: boolean
  specialCombo: boolean
  hintUsed: boolean
  timeLeft: number
}

export type RiskTier = 'standard' | 'high'

export type ChallengeModifier = {
  timeMul?: number
  movesDelta?: number
  extraChocolate?: number
  extraBombs?: number
  noBoosters?: boolean
  cometTailMin?: number
}

export type VariantKind =
  | 'clear'
  | 'tight-orbit'
  | 'sparse-fuel'
  | 'chocolate-bloom'
  | 'bomb-hail'
  | 'naked-sky'
  | 'comet-oath'

export type NebulaChallenge = {
  id: string
  nebulaId: string
  nebulaName: string
  kind: VariantKind
  tier: RiskTier
  risk: number
  title: string
  blurb: string
  stardust: number
  stars: number
  badge?: string
  modifiers: ChallengeModifier
}

const VARIANT_META: Record<
  Exclude<VariantKind, 'clear'>,
  { title: string; blurb: string; risk: number; badge: string; modifiers: ChallengeModifier }
> = {
  'tight-orbit': {
    title: 'Tight orbit',
    blurb: 'Half the orbit clock. Miss the window and the well takes you.',
    risk: 3,
    badge: 'Tight Orbit',
    modifiers: { timeMul: 0.55 },
  },
  'sparse-fuel': {
    title: 'Sparse fuel',
    blurb: 'Fewer moves. Every swap has to earn its burn.',
    risk: 3,
    badge: 'Sparse Fuel',
    modifiers: { movesDelta: -6 },
  },
  'chocolate-bloom': {
    title: 'Chocolate bloom',
    blurb: 'Extra chocolate wells. Contain the bloom or drown in it.',
    risk: 4,
    badge: 'Bloom Warden',
    modifiers: { extraChocolate: 4 },
  },
  'bomb-hail': {
    title: 'Bomb hail',
    blurb: 'Star bombs rain in. Clear them before the ticks run out.',
    risk: 4,
    badge: 'Hail Rider',
    modifiers: { extraBombs: 3 },
  },
  'naked-sky': {
    title: 'Naked sky',
    blurb: 'No boosters. No hammer. Just the board and your nerve.',
    risk: 5,
    badge: 'Naked Sky',
    modifiers: { noBoosters: true },
  },
  'comet-oath': {
    title: 'Comet oath',
    blurb: 'Comet Tail must crest the oath mark before you clear.',
    risk: 4,
    badge: 'Comet Oath',
    modifiers: { cometTailMin: 5 },
  },
}

const HIGH_KINDS = Object.keys(VARIANT_META) as Array<Exclude<VariantKind, 'clear'>>

export function cometTailTarget(sectorId: number): number {
  return 2 + sectorId
}

export function timeBankSeconds(sectorId: number): number {
  return 12 + sectorId * 4
}

export function challengesForLevel(level: LevelConfig): Challenge[] {
  const sector = level.sectorId
  const tailN = cometTailTarget(sector)
  const bank = timeBankSeconds(sector)
  const catalog: Record<ChallengeId, Challenge> = {
    'comet-tail': {
      id: 'comet-tail',
      title: `Comet Tail x${tailN}`,
      blurb: `Clear the orbit with a Comet Tail of ${tailN} or more`,
      stardust: 18 + sector * 4,
    },
    'nova-combo': {
      id: 'nova-combo',
      title: 'Nova strike',
      blurb: 'Ignite a sun or fuse two suns in one swap',
      stardust: 22 + sector * 5,
    },
    'time-bank': {
      id: 'time-bank',
      title: `${bank}s to spare`,
      blurb: `Finish with at least ${bank} seconds left on the orbit clock`,
      stardust: 16 + sector * 3,
    },
    'no-spread': {
      id: 'no-spread',
      title: 'Contain the bloom',
      blurb: 'Do not let chocolate spread',
      stardust: 20 + sector * 4,
    },
    'no-hints': {
      id: 'no-hints',
      title: 'Unaided collection',
      blurb: 'Complete orders without calling the hint coach',
      stardust: 14 + sector * 3,
    },
  }

  const rotation: ChallengeId[] = ['comet-tail', 'nova-combo', 'time-bank', 'no-spread', 'no-hints']
  const primary = rotation[level.id % rotation.length]!
  const picked = new Set<ChallengeId>([primary])
  if (sector >= 3) {
    picked.add(rotation[(level.id + 2) % rotation.length]!)
  }
  if (primary === 'no-spread' && level.chocolate.length === 0) {
    picked.delete('no-spread')
    picked.add('comet-tail')
  }
  if (primary === 'no-hints' && level.objective.type !== 'order') {
    picked.delete('no-hints')
    picked.add('time-bank')
  }
  if (picked.has('no-spread') && level.chocolate.length === 0) {
    picked.delete('no-spread')
    if (!picked.has('nova-combo')) picked.add('nova-combo')
    else picked.add('comet-tail')
  }

  return [...picked].map((id) => catalog[id]!)
}

export function evaluateChallenge(challenge: Challenge, level: LevelConfig, run: ChallengeRun): boolean {
  if (challenge.id === 'comet-tail') return run.peakCometTail >= cometTailTarget(level.sectorId)
  if (challenge.id === 'nova-combo') return run.specialCombo
  if (challenge.id === 'time-bank') return run.timeLeft >= timeBankSeconds(level.sectorId)
  if (challenge.id === 'no-spread') return !run.chocolateSpread
  if (challenge.id === 'no-hints') return !run.hintUsed
  return false
}

export function challengeToast(id: ChallengeId): string {
  if (id === 'comet-tail') return 'Comet Tail blazing — bonus stardust in the wake'
  if (id === 'nova-combo') return 'Nova strike logged in the ion wake'
  if (id === 'time-bank') return 'Orbit clock to spare — meteor trail bonus'
  if (id === 'no-spread') return 'Chocolate contained. The nebula holds.'
  return 'Unaided collection — stellar navigation'
}

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rewardForRisk(sectorId: number, risk: number): { stardust: number; stars: number } {
  return {
    stardust: 28 + sectorId * 10 + risk * 18,
    stars: Math.min(3, 1 + Math.floor(risk / 2)),
  }
}

export function challengesForNebula(nebulaId: string, rerollSeed = 0): NebulaChallenge[] {
  const nebula = CAMPAIGN.nebulas.find((n) => n.id === nebulaId)
  if (!nebula) return []
  const sector = nebula.sectorId
  const standardRewards = rewardForRisk(sector, 1)
  const standard: NebulaChallenge = {
    id: `${nebulaId}:clear`,
    nebulaId,
    nebulaName: nebula.name,
    kind: 'clear',
    tier: 'standard',
    risk: 1,
    title: 'Standard clear',
    blurb: `Chart ${nebula.name} under normal orbit pressure.`,
    stardust: standardRewards.stardust,
    stars: 1,
    modifiers: {},
  }

  const rotated = [...HIGH_KINDS]
  const start = hashSeed(`${nebulaId}:${rerollSeed}`) % rotated.length
  const picked = [0, 1, 2].map((i) => rotated[(start + i) % rotated.length]!)

  const high = picked.map((kind) => {
    const meta = VARIANT_META[kind]
    const rewards = rewardForRisk(sector, meta.risk)
    const modifiers = { ...meta.modifiers }
    if (kind === 'comet-oath') {
      modifiers.cometTailMin = cometTailTarget(sector) + 2
    }
    return {
      id: `${nebulaId}:${kind}`,
      nebulaId,
      nebulaName: nebula.name,
      kind,
      tier: 'high' as const,
      risk: meta.risk,
      title: meta.title,
      blurb: meta.blurb,
      stardust: rewards.stardust,
      stars: rewards.stars,
      badge: meta.badge,
      modifiers,
    }
  })

  return [standard, ...high]
}

export function nebulaChallengeById(id: string, rerollSeed = 0): NebulaChallenge | undefined {
  const nebulaId = id.split(':')[0]
  if (!nebulaId) return undefined
  return challengesForNebula(nebulaId, rerollSeed).find((c) => c.id === id)
}

function unusedIndices(level: LevelConfig, count: number): number[] {
  const used = new Set<number>([
    ...level.frosting,
    ...level.chocolate,
    ...level.locks,
    ...level.swirls,
    ...level.marmalade,
    ...level.bombs.map((b) => b.index),
    ...level.ingredients,
  ])
  const out: number[] = []
  for (let i = 0; i < 64 && out.length < count; i++) {
    if (!used.has(i)) {
      used.add(i)
      out.push(i)
    }
  }
  return out
}

export function applyChallengeModifiers(level: LevelConfig, challenge: NebulaChallenge): LevelConfig {
  const next: LevelConfig = {
    ...level,
    frosting: [...level.frosting],
    marmalade: [...level.marmalade],
    locks: [...level.locks],
    swirls: [...level.swirls],
    chocolate: [...level.chocolate],
    bombs: level.bombs.map((b) => ({ ...b })),
    jelly: [...level.jelly],
    ingredients: [...level.ingredients],
    exits: [...level.exits],
  }
  const m = challenge.modifiers
  if (m.timeMul) next.timeLimit = Math.max(18, Math.floor(level.timeLimit * m.timeMul))
  if (m.movesDelta) next.moves = Math.max(8, level.moves + m.movesDelta)
  if (m.extraChocolate) next.chocolate = [...next.chocolate, ...unusedIndices(next, m.extraChocolate)]
  if (m.extraBombs) {
    const extra = unusedIndices(next, m.extraBombs).map((index) => ({
      index,
      turns: Math.max(4, 11 - level.sectorId),
    }))
    next.bombs = [...next.bombs, ...extra]
  }
  return next
}

export function evaluateNebulaChallenge(challenge: NebulaChallenge, run: ChallengeRun): boolean {
  if (challenge.modifiers.cometTailMin) return run.peakCometTail >= challenge.modifiers.cometTailMin
  return true
}

import { describe, expect, it } from 'vitest'
import { refillBoard } from '../board'
import { applyGravity, gravityLeavesNoUnsupportedFloat } from '../gravity'
import { findMatches } from '../match'
import { assertNoHoles, createGame, reduce } from '../reducer'
import {
  BOARD_SIZE,
  BOARD_WIDTH,
  emptyCell,
  idx,
  isHole,
  isSwappable,
  occupies,
  starCell,
  type LevelConfig,
} from '../types'

function level(over: Partial<LevelConfig> = {}): LevelConfig {
  return {
    id: 1,
    seed: 42,
    name: 'Test',
    sectorId: 1,
    systemId: 's1-1',
    nebulaId: 's1-1-n1',
    stageId: 's1-1-n1-g1',
    moves: 25,
    colorCount: 6,
    rewardCap: 40,
    objective: { type: 'order', orders: [{ color: 'gold', count: 12 }] },
    frosting: [],
    marmalade: [],
    locks: [],
    swirls: [],
    chocolate: [],
    bombs: [],
    jelly: Array.from({ length: 64 }, () => 0),
    ingredients: [],
    exits: [0, 1, 2, 3, 4, 5, 6, 7],
    timeLimit: 180,
    ...over,
  }
}

describe('gravity and refill', () => {
  it('createGame leaves no empty playable cells', () => {
    const state = createGame(level({ seed: 99 }))
    expect(state.cells).toHaveLength(BOARD_SIZE)
    expect(state.cells.some((c) => isHole(c))).toBe(false)
    assertNoHoles(state)
  })

  it('fills a punched column', () => {
    const state = createGame(level({ seed: 7 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = { ...cells[idx(0, 7)]!, color: null, special: 'none', ingredient: false }
    cells[idx(0, 6)] = { ...cells[idx(0, 6)]!, color: null, special: 'none', ingredient: false }
    const grav = applyGravity(cells, 8, 8)
    expect(grav.cells[idx(0, 7)]!.color || grav.cells[idx(0, 7)]!.ingredient).toBeTruthy()
  })

  it('does not drop stars through frosting', () => {
    const frosting = [idx(3, 3)]
    const state = createGame(level({ seed: 12, frosting, sectorId: 5 }))
    expect(state.cells[idx(3, 3)]!.frosting).toBeGreaterThan(0)
    const punched = state.cells.map((c) => ({ ...c }))
    punched[idx(3, 2)] = starCell('gold')
    const grav = applyGravity(punched, 8, 8)
    expect(grav.cells[idx(3, 3)]!.frosting).toBeGreaterThan(0)
    expect(grav.moves.some((m) => m.to === idx(3, 3))).toBe(false)
    assertNoHoles(state)
  })

  it('locked stars stay put', () => {
    const state = createGame(level({ seed: 3, locks: [idx(1, 4)] }))
    const locked = state.cells[idx(1, 4)]!
    expect(locked.lock || locked.color).toBeTruthy()
    assertNoHoles(state)
  })

  it('packs occupying stars toward high y (bottom) and leaves holes at the top', () => {
    const cells = Array.from({ length: BOARD_SIZE }, () => emptyCell())
    cells[idx(2, 0)] = starCell('gold')
    cells[idx(2, 1)] = starCell('red')
    cells[idx(2, 2)] = starCell('blue')
    const grav = applyGravity(cells, 8, 8)
    expect(grav.cells[idx(2, 7)]!.color).toBe('blue')
    expect(grav.cells[idx(2, 6)]!.color).toBe('red')
    expect(grav.cells[idx(2, 5)]!.color).toBe('gold')
    expect(isHole(grav.cells[idx(2, 0)]!)).toBe(true)
    expect(isHole(grav.cells[idx(2, 4)]!)).toBe(true)
    expect(gravityLeavesNoUnsupportedFloat(grav.cells, 8, 8)).toBe(true)
    expect(grav.moves.some((m) => m.from === idx(2, 2) && m.to === idx(2, 7))).toBe(true)
  })

  it('refill fills remaining holes at the top after gravity', () => {
    const state = createGame(level({ seed: 21 }))
    const punched = state.cells.map((c) => ({ ...c }))
    punched[idx(1, 7)] = emptyCell()
    punched[idx(1, 6)] = emptyCell()
    const grav = applyGravity(punched, 8, 8)
    expect(isHole(grav.cells[idx(1, 0)]!)).toBe(true)
    expect(isHole(grav.cells[idx(1, 1)]!)).toBe(true)
    const filled = refillBoard({ ...state, cells: grav.cells })
    expect(filled.cells.some((c) => isHole(c))).toBe(false)
    const refillRows = filled.refill.map((r) => Math.floor(r.index / BOARD_WIDTH)).sort((a, b) => a - b)
    expect(refillRows).toEqual([0, 1])
    expect(occupies(filled.cells[idx(1, 0)]!)).toBe(true)
    expect(occupies(filled.cells[idx(1, 7)]!)).toBe(true)
  })

  it('a matching swap leaves every playable cell occupied', () => {
    const state = createGame(level({ seed: 77, moves: 30 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = starCell('red')
    cells[idx(1, 7)] = starCell('red')
    cells[idx(2, 7)] = starCell('blue')
    cells[idx(2, 6)] = starCell('red')
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(2, 7), b: idx(2, 6) })
    expect(next.events.some((e) => e.type === 'wave')).toBe(true)
    assertNoHoles(next)
    expect(gravityLeavesNoUnsupportedFloat(next.cells, 8, 8)).toBe(true)
    expect(next.cells.every((c) => !isHole(c))).toBe(true)
    const waves = next.events.filter((e) => e.type === 'wave')
    const first = waves[0]
    expect(first && first.type === 'wave' && first.destroyed.length >= 3).toBe(true)
    expect(first && first.type === 'wave' && first.refill.length + first.gravity.length > 0).toBe(true)
    const topAfter = [idx(0, 0), idx(1, 0), idx(2, 0)].every((i) => occupies(next.cells[i]!))
    expect(topAfter).toBe(true)
    const bottomAfter = [idx(0, 7), idx(1, 7), idx(2, 7)].every((i) => occupies(next.cells[i]!))
    expect(bottomAfter).toBe(true)
  })
})

describe('matches', () => {
  it('detects horizontal 3', () => {
    const state = createGame(level())
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 4)] = starCell('gold')
    cells[idx(1, 4)] = starCell('gold')
    cells[idx(2, 4)] = starCell('gold')
    const groups = findMatches(cells, BOARD_WIDTH, 8)
    expect(groups.some((g) => g.color === 'gold' && g.indices.length >= 3)).toBe(true)
  })
})

describe('special combos', () => {
  it('a 4-match creates a sun', () => {
    const state = createGame(level({ seed: 5 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 4)] = starCell('gold')
    cells[idx(1, 4)] = starCell('gold')
    cells[idx(2, 4)] = starCell('gold')
    cells[idx(3, 4)] = starCell('gold')
    const groups = findMatches(cells, BOARD_WIDTH, 8)
    expect(groups.some((g) => g.kind === 'wrapped' && g.indices.length >= 4)).toBe(true)
  })

  it('two suns fuse into a larger blast and refill without holes', () => {
    const state = createGame(level({ seed: 5 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(2, 2)] = { ...starCell('gold'), special: 'wrapped' }
    cells[idx(3, 2)] = { ...starCell('red'), special: 'wrapped' }
    const primed = { ...state, cells }
    const next = reduce(primed, { type: 'swap', a: idx(2, 2), b: idx(3, 2) })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave' && wave.destroyed.length).toBeGreaterThan(9)
    assertNoHoles(next)
    expect(next.score).toBeGreaterThanOrEqual(0)
  })

  it('sun flare destroys a 5x5 neighborhood — bigger than a 3-match', () => {
    const state = createGame(level({ seed: 12 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(3, 3)] = { ...starCell('gold'), special: 'wrapped' }
    const next = reduce({ ...state, cells }, { type: 'ignite-special', index: idx(3, 3) })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave' && wave.destroyed.length).toBeGreaterThanOrEqual(25)
    assertNoHoles(next)
  })

  it('swapping a sun with a non-matching neighbor still ignites', () => {
    const state = createGame(level({ seed: 11 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = { ...starCell('gold'), special: 'wrapped' }
    cells[idx(1, 7)] = starCell('blue')
    cells[idx(2, 7)] = starCell('red')
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(0, 7), b: idx(1, 7) })
    expect(next.events.some((e) => e.type === 'wave')).toBe(true)
    expect(next.events.some((e) => e.type === 'invalid-swap')).toBe(false)
    assertNoHoles(next)
  })

  it('double-tap ignite detonates a sun in place', () => {
    const state = createGame(level({ seed: 12 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(7, 7)] = { ...starCell('gold'), special: 'wrapped' }
    const next = reduce({ ...state, cells }, { type: 'ignite-special', index: idx(7, 7) })
    expect(next.events.some((e) => e.type === 'wave')).toBe(true)
    assertNoHoles(next)
  })
})

describe('swappable tiles', () => {
  it('gravity well clears a 3x3 pocket', () => {
    const state = createGame(level({ seed: 14 }))
    const cells = state.cells.map((c) => ({ ...c }))
    const origin = idx(3, 3)
    const next = reduce({ ...state, cells }, { type: 'well', index: origin })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave' && wave.destroyed.length).toBeGreaterThanOrEqual(9)
    assertNoHoles(next)
  })

  it('shuffle remixes matchable stars without leaving holes', () => {
    const state = createGame(level({ seed: 18 }))
    const next = reduce(state, { type: 'shuffle' })
    assertNoHoles(next)
    expect(next.cells.every((c) => !isHole(c))).toBe(true)
  })

  it('lets marmalade and locked stars move and keeps frosting stuck', () => {
    expect(isSwappable({ ...starCell('red'), marmalade: true })).toBe(true)
    expect(isSwappable({ ...starCell('red'), lock: true })).toBe(true)
    expect(isSwappable({ ...starCell('red'), frosting: 1 })).toBe(false)
    expect(isSwappable({ ...starCell('gold'), special: 'wrapped' })).toBe(true)
  })
})

describe('deterministic seed', () => {
  it('same seed produces the same opening board', () => {
    const a = createGame(level({ seed: 12345 }))
    const b = createGame(level({ seed: 12345 }))
    expect(a.cells.map((c) => `${c.color}:${c.special}:${c.frosting}`).join()).toBe(
      b.cells.map((c) => `${c.color}:${c.special}:${c.frosting}`).join(),
    )
  })
})

describe('comet tail and orbit clock', () => {
  it('grows comet tail on a scoring swap and decay resets it', () => {
    const state = createGame(level({ seed: 77, moves: 30 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = starCell('red')
    cells[idx(1, 7)] = starCell('red')
    cells[idx(2, 7)] = starCell('blue')
    cells[idx(2, 6)] = starCell('red')
    const next = reduce({ ...state, cells, cometTail: 0 }, { type: 'swap', a: idx(2, 7), b: idx(2, 6) })
    expect(next.cometTail).toBe(1)
    expect(next.status).toBe('playing')
    const decayed = reduce(next, { type: 'decay-comet-tail' })
    expect(decayed.cometTail).toBe(0)
    expect(decayed.cells).toBe(next.cells)
  })

  it('fails the level when the orbit clock hits zero', () => {
    const state = createGame(level({ seed: 3, timeLimit: 2 }))
    expect(state.timeLeft).toBe(2)
    const mid = reduce(state, { type: 'tick-clock' })
    expect(mid.timeLeft).toBe(1)
    expect(mid.status).toBe('playing')
    expect(mid.cells).toBe(state.cells)
    const out = reduce(mid, { type: 'tick-clock' })
    expect(out.status).toBe('lost')
    expect(out.events.some((e) => e.type === 'status' && e.reason === 'Orbit clock expired')).toBe(true)
  })

  it('illegal swaps bounce without freezing play', () => {
    const state = createGame(level({ seed: 4 }))
    const far = reduce(state, { type: 'swap', a: idx(0, 0), b: idx(3, 3) })
    expect(far.status).toBe('playing')
    expect(far.events.some((e) => e.type === 'invalid-swap')).toBe(true)
    expect(far.cometTail).toBe(0)
    const next = reduce(far, { type: 'swap', a: idx(0, 0), b: idx(0, 1) })
    expect(next.status).toBe('playing')
    expect(next.events.some((e) => e.type === 'invalid-swap' || e.type === 'swap' || e.type === 'wave')).toBe(true)
  })
})

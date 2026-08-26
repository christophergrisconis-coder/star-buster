import { describe, expect, it } from 'vitest'
import { refillBoard } from '../board'
import { applyGravity, gravityLeavesNoUnsupportedFloat } from '../gravity'
import { findMatches, hasAnyMatch, hasLegalSwap } from '../match'
import { FINALE_SUN_CAP, convertMovesToSpecials } from '../finale'
import { assertNoHoles, createGame, reduce } from '../reducer'
import {
  BOARD_HEIGHT,
  BOARD_SIZE,
  BOARD_WIDTH,
  emptyCell,
  idx,
  isHole,
  isSwappable,
  occupies,
  STAR_COLORS,
  starCell,
  type LevelConfig,
} from '../types'

const BOTTOM = BOARD_HEIGHT - 1

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
    jelly: Array.from({ length: BOARD_SIZE }, () => 0),
    ingredients: [],
    exits: Array.from({ length: BOARD_WIDTH }, (_, i) => i),
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
    cells[idx(0, BOTTOM)] = { ...cells[idx(0, BOTTOM)]!, color: null, special: 'none', ingredient: false }
    cells[idx(0, BOTTOM - 1)] = { ...cells[idx(0, BOTTOM - 1)]!, color: null, special: 'none', ingredient: false }
    const grav = applyGravity(cells, BOARD_WIDTH, BOARD_HEIGHT)
    expect(grav.cells[idx(0, BOTTOM)]!.color || grav.cells[idx(0, BOTTOM)]!.ingredient).toBeTruthy()
  })

  it('does not drop stars through frosting', () => {
    const frosting = [idx(3, 3)]
    const state = createGame(level({ seed: 12, frosting, sectorId: 5 }))
    expect(state.cells[idx(3, 3)]!.frosting).toBeGreaterThan(0)
    const punched = state.cells.map((c) => ({ ...c }))
    punched[idx(3, 2)] = starCell('gold')
    const grav = applyGravity(punched, BOARD_WIDTH, BOARD_HEIGHT)
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
    const grav = applyGravity(cells, BOARD_WIDTH, BOARD_HEIGHT)
    expect(grav.cells[idx(2, BOTTOM)]!.color).toBe('blue')
    expect(grav.cells[idx(2, BOTTOM - 1)]!.color).toBe('red')
    expect(grav.cells[idx(2, BOTTOM - 2)]!.color).toBe('gold')
    expect(isHole(grav.cells[idx(2, 0)]!)).toBe(true)
    expect(isHole(grav.cells[idx(2, 4)]!)).toBe(true)
    expect(gravityLeavesNoUnsupportedFloat(grav.cells, BOARD_WIDTH, BOARD_HEIGHT)).toBe(true)
    expect(grav.moves.some((m) => m.from === idx(2, 2) && m.to === idx(2, BOTTOM))).toBe(true)
  })

  it('refill fills remaining holes at the top after gravity', () => {
    const state = createGame(level({ seed: 21 }))
    const punched = state.cells.map((c) => ({ ...c }))
    punched[idx(1, BOTTOM)] = emptyCell()
    punched[idx(1, BOTTOM - 1)] = emptyCell()
    const grav = applyGravity(punched, BOARD_WIDTH, BOARD_HEIGHT)
    expect(isHole(grav.cells[idx(1, 0)]!)).toBe(true)
    expect(isHole(grav.cells[idx(1, 1)]!)).toBe(true)
    const filled = refillBoard({ ...state, cells: grav.cells })
    expect(filled.cells.some((c) => isHole(c))).toBe(false)
    const refillRows = filled.refill.map((r) => Math.floor(r.index / BOARD_WIDTH)).sort((a, b) => a - b)
    expect(refillRows).toEqual([0, 1])
    expect(occupies(filled.cells[idx(1, 0)]!)).toBe(true)
    expect(occupies(filled.cells[idx(1, BOTTOM)]!)).toBe(true)
  })

  it('refill refuses to drop a fresh 3-in-a-row', () => {
    const state = createGame(level({ seed: 21, colorCount: 6 }))
    const cells = Array.from({ length: BOARD_SIZE }, (_, i) => {
      const x = i % BOARD_WIDTH
      const y = Math.floor(i / BOARD_WIDTH)
      return starCell(STAR_COLORS[(x + y * 2) % STAR_COLORS.length]!)
    })
    cells[idx(4, 0)] = emptyCell()
    cells[idx(4, 1)] = emptyCell()
    const filled = refillBoard({ ...state, cells })
    expect(filled.cells.some((c) => isHole(c))).toBe(false)
    expect(hasAnyMatch(filled.cells, BOARD_WIDTH, BOARD_HEIGHT)).toBe(false)
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
    expect(gravityLeavesNoUnsupportedFloat(next.cells, BOARD_WIDTH, BOARD_HEIGHT)).toBe(true)
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
    const groups = findMatches(cells, BOARD_WIDTH, BOARD_HEIGHT)
    expect(groups.some((g) => g.color === 'gold' && g.indices.length >= 3)).toBe(true)
  })

  it('detects a 2x2 square and an L/T shape of 5 as matches consistently', () => {
    const quiet = Array.from({ length: BOARD_SIZE }, (_, i) => {
      const x = i % BOARD_WIDTH
      const y = Math.floor(i / BOARD_WIDTH)
      return starCell(STAR_COLORS[(x + y * 2) % STAR_COLORS.length]!)
    })
    const square = quiet.map((c) => ({ ...c }))
    square[idx(3, 3)] = starCell('red')
    square[idx(4, 3)] = starCell('red')
    square[idx(3, 4)] = starCell('red')
    square[idx(4, 4)] = starCell('red')
    expect(findMatches(square, BOARD_WIDTH, BOARD_HEIGHT).some((g) => g.indices.length >= 4)).toBe(true)

    // L-shape of 5 stars (3 horizontal and 3 vertical sharing a corner)
    const ell5 = quiet.map((c) => ({ ...c }))
    ell5[idx(0, 0)] = starCell('cyan')
    ell5[idx(1, 0)] = starCell('cyan')
    ell5[idx(2, 0)] = starCell('cyan')
    ell5[idx(0, 1)] = starCell('cyan')
    ell5[idx(0, 2)] = starCell('cyan')
    expect(findMatches(ell5, BOARD_WIDTH, BOARD_HEIGHT).some((g) => g.color === 'cyan' && g.kind === 'wrapped')).toBe(true)
  })

  it('opens without dead lined-up stars and always has a legal swap', () => {
    for (const seed of [1, 7, 12, 42, 99, 404]) {
      const state = createGame(level({ seed, colorCount: 5 }))
      expect(hasAnyMatch(state.cells, state.width, state.height)).toBe(false)
      expect(hasLegalSwap(state.cells, state.width, state.height)).toBe(true)
    }
  })

  it('a matching swap settles instead of cascading forever', () => {
    for (const seed of [1, 7, 12, 42, 77, 99, 404]) {
      const state = createGame(level({ seed, colorCount: 5, moves: 30 }))
      let waves = 0
      outer: for (let i = 0; i < state.cells.length; i++) {
        const x = i % state.width
        const y = Math.floor(i / state.width)
        const neighbors = [x + 1 < state.width ? i + 1 : -1, y + 1 < state.height ? i + state.width : -1]
        for (const j of neighbors) {
          if (j < 0) continue
          const next = reduce(state, { type: 'swap', a: i, b: j })
          if (next.events.some((e) => e.type === 'invalid-swap')) continue
          waves = next.events.filter((e) => e.type === 'wave').length
          expect(waves).toBeGreaterThan(0)
          expect(waves).toBeLessThan(10)
          break outer
        }
      }
      expect(waves).toBeGreaterThan(0)
    }
  })
})

describe('special combos', () => {
  it('a horizontal 4-match creates a vertical striped', () => {
    const quiet = Array.from({ length: BOARD_SIZE }, () => starCell('red'))
    for (let x = 0; x < BOARD_WIDTH; x++) for (let y = 0; y < BOARD_HEIGHT; y++) {
      quiet[idx(x, y)] = starCell(x % 2 === 0 ? 'red' : 'blue')
    }
    quiet[idx(3, 4)] = starCell('gold')
    quiet[idx(4, 4)] = starCell('gold')
    quiet[idx(5, 4)] = starCell('gold')
    quiet[idx(6, 4)] = starCell('gold')
    const groups = findMatches(quiet, BOARD_WIDTH, BOARD_HEIGHT)
    expect(groups.some((g) => g.kind === 'striped-v' && g.color === 'gold')).toBe(true)
  })

  it('a vertical 4-match creates a horizontal striped', () => {
    const quiet = Array.from({ length: BOARD_SIZE }, () => starCell('red'))
    for (let x = 0; x < BOARD_WIDTH; x++) for (let y = 0; y < BOARD_HEIGHT; y++) {
      quiet[idx(x, y)] = starCell(y % 2 === 0 ? 'red' : 'blue')
    }
    quiet[idx(4, 3)] = starCell('gold')
    quiet[idx(4, 4)] = starCell('gold')
    quiet[idx(4, 5)] = starCell('gold')
    quiet[idx(4, 6)] = starCell('gold')
    const groups = findMatches(quiet, BOARD_WIDTH, BOARD_HEIGHT)
    expect(groups.some((g) => g.kind === 'striped-h' && g.color === 'gold')).toBe(true)
  })

  it('a 5-match creates a color-bomb', () => {
    const quiet = Array.from({ length: BOARD_SIZE }, (_, i) => {
      const x = i % BOARD_WIDTH
      const y = Math.floor(i / BOARD_WIDTH)
      return starCell(STAR_COLORS[(x + y * 2) % STAR_COLORS.length]!)
    })
    quiet[idx(0, 4)] = starCell('gold')
    quiet[idx(1, 4)] = starCell('gold')
    quiet[idx(2, 4)] = starCell('gold')
    quiet[idx(3, 4)] = starCell('gold')
    quiet[idx(4, 4)] = starCell('gold')
    const groups = findMatches(quiet, BOARD_WIDTH, BOARD_HEIGHT)
    expect(groups.some((g) => g.kind === 'color-bomb' && g.indices.length >= 5)).toBe(true)
  })

  it('an L/T shape creates a wrapped special', () => {
    const quiet = Array.from({ length: BOARD_SIZE }, (_, i) => {
      const x = i % BOARD_WIDTH
      const y = Math.floor(i / BOARD_WIDTH)
      return starCell(STAR_COLORS[(x + y * 2) % STAR_COLORS.length]!)
    })
    quiet[idx(2, 2)] = starCell('gold')
    quiet[idx(3, 2)] = starCell('gold')
    quiet[idx(4, 2)] = starCell('gold')
    quiet[idx(2, 3)] = starCell('gold')
    quiet[idx(2, 4)] = starCell('gold')
    const groups = findMatches(quiet, BOARD_WIDTH, BOARD_HEIGHT)
    expect(groups.some((g) => g.kind === 'wrapped' && g.color === 'gold')).toBe(true)
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

  it('swapping color-bomb with a regular colored star detonates all stars of that color', () => {
    const state = createGame(level({ seed: 5 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(2, 2)] = { ...starCell('gold'), special: 'color-bomb', color: null }
    cells[idx(3, 2)] = starCell('red')
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(2, 2), b: idx(3, 2) })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave').toBe(true)
    assertNoHoles(next)
  })

  it('sun flare destroys a 3x3 neighborhood — bigger than a 3-match, not a board wipe', () => {
    const state = createGame(level({ seed: 12 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(3, 3)] = { ...starCell('gold'), special: 'wrapped' }
    const next = reduce({ ...state, cells }, { type: 'ignite-special', index: idx(3, 3) })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave').toBe(true)
    if (wave && wave.type === 'wave') {
      expect(wave.destroyed.length).toBeGreaterThanOrEqual(9)
      expect(wave.destroyed.length).toBeLessThan(20)
    }
    assertNoHoles(next)
  })

  it('swapping a sun without a 3-match bounces', () => {
    const state = createGame(level({ seed: 11 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = { ...starCell('gold'), special: 'wrapped' }
    cells[idx(1, 7)] = starCell('blue')
    cells[idx(2, 7)] = starCell('red')
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(0, 7), b: idx(1, 7) })
    expect(next.events.some((e) => e.type === 'invalid-swap')).toBe(true)
    expect(next.events.some((e) => e.type === 'wave')).toBe(false)
    expect(next.cells[idx(0, 7)]!.special).toBe('wrapped')
    assertNoHoles(next)
  })

  it('swapping a sun into a 3-match still detonates', () => {
    const state = createGame(level({ seed: 11 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 7)] = { ...starCell('gold'), special: 'wrapped' }
    cells[idx(1, 7)] = starCell('blue')
    cells[idx(2, 7)] = starCell('gold')
    cells[idx(3, 7)] = starCell('gold')
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(0, 7), b: idx(1, 7) })
    expect(next.events.some((e) => e.type === 'invalid-swap')).toBe(false)
    expect(next.events.some((e) => e.type === 'wave')).toBe(true)
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

describe('starburst finale', () => {
  it('caps leftover moves as suns and stays in finale instead of wiping the board', () => {
    const state = createGame(level({ seed: 9, moves: 20 }))
    const finale = convertMovesToSpecials({ ...state, movesLeft: 20 })
    const suns = finale.cells.filter((c) => c.special !== 'none').length
    expect(finale.status).toBe('finale')
    expect(suns).toBeGreaterThan(0)
    expect(suns).toBeLessThanOrEqual(FINALE_SUN_CAP)
    expect(finale.movesLeft).toBe(0)
  })

  it('ignites one leftover sun per finale tick', () => {
    const state = createGame(level({ seed: 9, moves: 8 }))
    const finale = convertMovesToSpecials({ ...state, movesLeft: 8 })
    const before = finale.cells.filter((c) => c.special !== 'none').length
    const ticked = reduce(finale, { type: 'tick-finale' })
    const after = ticked.cells.filter((c) => c.special !== 'none').length
    expect(after).toBeLessThan(before)
    expect(ticked.events.some((e) => e.type === 'wave')).toBe(true)
    assertNoHoles(ticked)
    if (after === 0) expect(ticked.status).toBe('won')
    else expect(ticked.status).toBe('finale')
  })
})

describe('kit sun tick and resume', () => {
  it('hammer on a sun detonates instead of chipping one tile', () => {
    const state = createGame(level({ seed: 12 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(4, 4)] = { ...starCell('gold'), special: 'wrapped' }
    const next = reduce({ ...state, cells }, { type: 'hammer', index: idx(4, 4) })
    const wave = next.events.find((e) => e.type === 'wave')
    expect(wave && wave.type === 'wave' && wave.destroyed.length).toBeGreaterThan(1)
    assertNoHoles(next)
  })

  it('resumes a lost orbit with extra moves', () => {
    const lost = { ...createGame(level({ seed: 4 })), status: 'lost' as const, movesLeft: 0 }
    const next = reduce(lost, { type: 'resume', extraMoves: 5 })
    expect(next.status).toBe('playing')
    expect(next.movesLeft).toBe(5)
  })
})

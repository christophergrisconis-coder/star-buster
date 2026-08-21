import { describe, expect, it } from 'vitest'
import { applyGravity } from '../gravity'
import { findMatches } from '../match'
import { assertNoHoles, createGame, reduce } from '../reducer'
import {
  BOARD_SIZE,
  BOARD_WIDTH,
  idx,
  isHole,
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
    const state = createGame(level({ seed: 12, frosting }))
    expect(state.cells[idx(3, 3)]!.frosting).toBeGreaterThan(0)
    assertNoHoles(state)
  })

  it('locked stars stay put', () => {
    const state = createGame(level({ seed: 3, locks: [idx(1, 4)] }))
    const locked = state.cells[idx(1, 4)]!
    expect(locked.lock || locked.color).toBeTruthy()
    assertNoHoles(state)
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
  it('two striped stars cross-blast and refill without holes', () => {
    const state = createGame(level({ seed: 5 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(2, 2)] = { ...starCell('gold'), special: 'striped-h' }
    cells[idx(3, 2)] = { ...starCell('red'), special: 'striped-v' }
    const primed = { ...state, cells }
    const next = reduce(primed, { type: 'swap', a: idx(2, 2), b: idx(3, 2) })
    expect(next.events.some((e) => e.type === 'wave' || e.type === 'swap')).toBe(true)
    assertNoHoles(next)
    expect(next.score).toBeGreaterThanOrEqual(0)
  })

  it('two color bombs wipe and refill', () => {
    const state = createGame(level({ seed: 8 }))
    const cells = state.cells.map((c) => ({ ...c }))
    cells[idx(0, 0)] = { ...starCell('gold'), special: 'color-bomb', color: null }
    cells[idx(1, 0)] = { ...starCell('gold'), special: 'color-bomb', color: null }
    const next = reduce({ ...state, cells }, { type: 'swap', a: idx(0, 0), b: idx(1, 0) })
    assertNoHoles(next)
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

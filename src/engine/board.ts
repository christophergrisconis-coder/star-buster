import { frostingHpFor } from '~/data/difficulty'
import { findMatches, hasAnyMatch, hasLegalSwap } from './match'
import { nextRng, rngInt } from './prng'
import {
  BOARD_HEIGHT,
  BOARD_SIZE,
  BOARD_WIDTH,
  STAR_COLORS,
  cloneCell,
  emptyCell,
  isHole,
  isMatchable,
  starCell,
  type Cell,
  type GameState,
  type LevelConfig,
  type RefillCell,
  type StarColor,
} from './types'

export function newStar(color: StarColor, jelly = 0): Cell {
  return starCell(color, jelly)
}

function wouldMatchAt(
  cells: Cell[],
  index: number,
  color: StarColor,
  width: number,
  height: number,
): boolean {
  const prev = cells[index]!
  cells[index] = newStar(color, prev.jelly)
  const hit = findMatches(cells, width, height).some((g) => g.indices.includes(index))
  cells[index] = prev
  return hit
}

function pickSafeRefillColor(
  cells: Cell[],
  index: number,
  colors: StarColor[],
  rng: number,
  width: number,
  height: number,
): { color: StarColor; rng: number } {
  const start = rngInt(rng, colors.length)
  rng = start.state
  for (let k = 0; k < colors.length; k++) {
    const color = colors[(start.n + k) % colors.length]!
    if (!wouldMatchAt(cells, index, color, width, height)) return { color, rng }
  }
  return { color: colors[start.n]!, rng }
}

export function refillBoard(state: GameState): {
  cells: Cell[]
  rngState: number
  refill: RefillCell[]
} {
  const cells = state.cells.map(cloneCell)
  let rng = state.rngState
  const refill: RefillCell[] = []
  const colors = STAR_COLORS.slice(0, state.colorCount)
  const holes: number[] = []

  // Fill lowest holes first so each new star can see settled neighbors below.
  for (let y = state.height - 1; y >= 0; y--) {
    for (let x = 0; x < state.width; x++) {
      const i = x + y * state.width
      if (isHole(cells[i]!)) holes.push(i)
    }
  }

  for (const i of holes) {
    const picked = pickSafeRefillColor(cells, i, colors, rng, state.width, state.height)
    rng = picked.rng
    const jelly = cells[i]!.jelly
    cells[i] = newStar(picked.color, jelly)
    refill.push({ index: i, color: picked.color, special: 'none' })
  }

  return { cells, rngState: rng, refill }
}

export function playableHasHoles(cells: Cell[]): boolean {
  return cells.some((c) => isHole(c))
}

export function generateInitialCells(
  config: LevelConfig,
): { cells: Cell[]; rngState: number } {
  let rng = config.seed | 0
  const colors = STAR_COLORS.slice(0, config.colorCount)
  const cells: Cell[] = Array.from({ length: BOARD_SIZE }, () => emptyCell())

  for (let i = 0; i < BOARD_SIZE; i++) {
    cells[i] = emptyCell(config.jelly[i] ?? 0)
  }

  for (const index of config.frosting) {
    cells[index] = {
      ...emptyCell(cells[index]!.jelly),
      frosting: frostingHpFor(config.sectorId, index),
    }
  }

  for (const index of config.chocolate) {
    cells[index] = { ...emptyCell(cells[index]!.jelly), chocolate: true }
  }
  for (const index of config.swirls) {
    if (cells[index]!.frosting) continue
    cells[index] = { ...emptyCell(cells[index]!.jelly), swirl: true }
  }
  for (const index of config.ingredients) {
    if (cells[index]!.frosting || cells[index]!.chocolate) continue
    cells[index] = { ...emptyCell(cells[index]!.jelly), ingredient: true }
  }

  const fillable = (i: number) =>
    cells[i]!.frosting === 0 &&
    !cells[i]!.chocolate &&
    !cells[i]!.swirl &&
    !cells[i]!.ingredient

  for (let attempt = 0; attempt < 80; attempt++) {
    let attemptRng = rng
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!fillable(i)) continue
      const r = rngInt(attemptRng, colors.length)
      attemptRng = r.state
      cells[i] = {
        ...newStar(colors[r.n]!, cells[i]!.jelly),
      }
    }
    const broken = breakOpeningMatches(cells, colors, attemptRng)
    attemptRng = broken.rng
    if (!hasAnyMatch(cells, BOARD_WIDTH, BOARD_HEIGHT) && hasLegalSwap(cells, BOARD_WIDTH, BOARD_HEIGHT)) {
      rng = attemptRng
      break
    }
    rng = attemptRng
  }

  for (const index of config.marmalade) {
    if (cells[index] && cells[index]!.color) cells[index]!.marmalade = true
  }
  for (const index of config.locks) {
    if (cells[index] && cells[index]!.color) cells[index]!.lock = true
  }
  for (const bomb of config.bombs) {
    if (cells[bomb.index] && cells[bomb.index]!.color) {
      cells[bomb.index]!.bomb = bomb.turns
    }
  }

  return { cells, rngState: rng }
}

function breakOpeningMatches(
  cells: Cell[],
  colors: StarColor[],
  rng: number,
): { rng: number } {
  for (let guard = 0; guard < 32; guard++) {
    const matches = findMatches(cells, BOARD_WIDTH, BOARD_HEIGHT)
    if (matches.length === 0) break
    for (const group of matches) {
      const i = group.indices[Math.floor(group.indices.length / 2)]!
      if (!isMatchable(cells[i]!)) continue
      const forbidden = new Set(
        group.indices.map((idx) => cells[idx]!.color).filter((c): c is StarColor => !!c),
      )
      const choices = colors.filter((c) => !forbidden.has(c))
      const palette = choices.length ? choices : colors
      const r = rngInt(rng, palette.length)
      rng = r.state
      cells[i] = { ...cells[i]!, color: palette[r.n]! }
    }
  }
  return { rng }
}

export function seedShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let rng = seed
  for (let i = copy.length - 1; i > 0; i--) {
    const r = nextRng(rng)
    rng = r.state
    const j = Math.floor(r.value * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}

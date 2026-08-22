import { frostingHpFor } from '~/data/difficulty'
import { nextRng, rngInt } from './prng'
import {
  BOARD_HEIGHT,
  BOARD_SIZE,
  BOARD_WIDTH,
  STAR_COLORS,
  cloneCell,
  emptyCell,
  isHole,
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

export function refillBoard(state: GameState): {
  cells: Cell[]
  rngState: number
  refill: RefillCell[]
} {
  const cells = state.cells.map(cloneCell)
  let rng = state.rngState
  const refill: RefillCell[] = []
  const colors = STAR_COLORS.slice(0, state.colorCount)

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const i = x + y * state.width
      if (!isHole(cells[i]!)) continue
      const r = rngInt(rng, colors.length)
      rng = r.state
      const color = colors[r.n]!
      const jelly = cells[i]!.jelly
      cells[i] = newStar(color, jelly)
      refill.push({ index: i, color, special: 'none' })
    }
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

  for (let attempt = 0; attempt < 40; attempt++) {
    let attemptRng = rng
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!fillable(i)) continue
      const r = rngInt(attemptRng, colors.length)
      attemptRng = r.state
      cells[i] = {
        ...newStar(colors[r.n]!, cells[i]!.jelly),
      }
    }
    if (!hasImmediateMatch(cells, config.colorCount)) {
      rng = attemptRng
      break
    }
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

function hasImmediateMatch(cells: Cell[], _colorCount: number): boolean {
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const i = x + y * BOARD_WIDTH
      const cell = cells[i]!
      if (!cell.color || cell.frosting || cell.swirl || cell.chocolate) continue
      if (
        x >= 2 &&
        cells[i - 1]!.color === cell.color &&
        cells[i - 2]!.color === cell.color &&
        isSameMatchable(cells[i - 1]!) &&
        isSameMatchable(cells[i - 2]!)
      ) {
        return true
      }
      if (
        y >= 2 &&
        cells[i - BOARD_WIDTH]!.color === cell.color &&
        cells[i - BOARD_WIDTH * 2]!.color === cell.color &&
        isSameMatchable(cells[i - BOARD_WIDTH]!) &&
        isSameMatchable(cells[i - BOARD_WIDTH * 2]!)
      ) {
        return true
      }
    }
  }
  return false
}

function isSameMatchable(cell: Cell): boolean {
  return !!cell.color && !cell.swirl && !cell.chocolate && cell.frosting === 0
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

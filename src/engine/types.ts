export const BOARD_WIDTH = 9
export const BOARD_HEIGHT = 9
export const BOARD_SIZE = BOARD_WIDTH * BOARD_HEIGHT

export const STAR_COLORS = [
  'gold',
  'red',
  'green',
  'blue',
  'purple',
  'cyan',
] as const

export type StarColor = (typeof STAR_COLORS)[number]

export type SpecialKind =
  | 'none'
  | 'striped-h'
  | 'striped-v'
  | 'wrapped'
  | 'color-bomb'
  | 'starfish'

export type BlastSize = 'S' | 'M' | 'L'

export type ComboWord =
  | 'NICE'
  | 'SWEET'
  | 'SUPERSTAR'
  | 'STELLAR'
  | 'SUPERNOVA'
  | 'GALAXY BUSTER'

export type GameStatus = 'playing' | 'finale' | 'won' | 'lost'

export type OrderSpec = {
  color?: StarColor
  special?: Exclude<SpecialKind, 'none'>
  count: number
}

export type Objective =
  | { type: 'jelly'; remaining: number }
  | { type: 'ingredient'; remaining: number }
  | { type: 'order'; orders: OrderSpec[] }

export interface Cell {
  color: StarColor | null
  special: SpecialKind
  frosting: number
  marmalade: boolean
  lock: boolean
  swirl: boolean
  chocolate: boolean
  bomb: number
  jelly: number
  ingredient: boolean
}

export interface GravityMove {
  from: number
  to: number
}

export interface SpawnedSpecial {
  index: number
  special: SpecialKind
}

export interface RefillCell {
  index: number
  color: StarColor
  special: SpecialKind
}

export type EngineEvent =
  | { type: 'swap'; a: number; b: number }
  | { type: 'invalid-swap'; a: number; b: number }
  | {
      type: 'wave'
      combo: number
      blast: BlastSize
      destroyed: number[]
      spawnedSpecials: SpawnedSpecial[]
      gravity: GravityMove[]
      refill: RefillCell[]
      groups: number
      word?: ComboWord
    }
  | { type: 'chocolate-spread'; from: number; to: number }
  | { type: 'bomb-tick'; indices: number[] }
  | { type: 'finale-convert'; indices: number[]; kind: SpecialKind }
  | { type: 'status'; status: GameStatus; reason?: string }
  | { type: 'reward'; coins: number; stardust: number; capped: boolean }
  | { type: 'ingredient-collect'; indices: number[] }
  | { type: 'special-combo'; kind: string }
  | { type: 'comet-tail'; value: number; decayed?: boolean }
  | { type: 'kit-drop'; item: string; index: number }

export interface LevelConfig {
  id: number
  seed: number
  name: string
  sectorId: number
  systemId: string
  nebulaId: string
  stageId: string
  moves: number
  colorCount: number
  rewardCap: number
  objective: Objective
  frosting: number[]
  marmalade: number[]
  locks: number[]
  swirls: number[]
  chocolate: number[]
  bombs: Array<{ index: number; turns: number }>
  jelly: number[]
  ingredients: number[]
  exits: number[]
  timeLimit: number
  boss?: boolean
}

export interface GameState {
  width: number
  height: number
  cells: Cell[]
  movesLeft: number
  score: number
  combo: number
  cometTail: number
  seed: number
  rngState: number
  colorCount: number
  objective: Objective
  status: GameStatus
  rewardCap: number
  coinsEarned: number
  stardustEarned: number
  chocolateDestroyedThisMove: boolean
  events: EngineEvent[]
  exits: boolean[]
  levelId: number
  sectorId: number
  timeLeft: number
  timeLimit: number
  kitDrops: number
}

export type EngineAction =
  | { type: 'swap'; a: number; b: number }
  | { type: 'hammer'; index: number }
  | { type: 'well'; index: number }
  | { type: 'shuffle' }
  | { type: 'color-splash'; index: number }
  | { type: 'add-moves'; count: number }
  | { type: 'spawn-special'; index: number; special: SpecialKind }
  | { type: 'ignite-special'; index: number }
  | { type: 'tick-finale' }
  | { type: 'decay-comet-tail' }
  | { type: 'tick-clock' }
  | { type: 'resume'; extraMoves?: number; extraTime?: number }

export function idx(x: number, y: number, width = BOARD_WIDTH): number {
  return x + y * width
}

export function xy(index: number, width = BOARD_WIDTH): { x: number; y: number } {
  return { x: index % width, y: Math.floor(index / width) }
}

export function inBounds(
  x: number,
  y: number,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
): boolean {
  return x >= 0 && y >= 0 && x < width && y < height
}

export function emptyCell(jelly = 0): Cell {
  return {
    color: null,
    special: 'none',
    frosting: 0,
    marmalade: false,
    lock: false,
    swirl: false,
    chocolate: false,
    bomb: 0,
    jelly,
    ingredient: false,
  }
}

export function starCell(color: StarColor, jelly = 0): Cell {
  return {
    ...emptyCell(jelly),
    color,
  }
}

export function cloneCell(cell: Cell): Cell {
  return { ...cell }
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    cells: state.cells.map(cloneCell),
    objective:
      state.objective.type === 'order'
        ? { type: 'order', orders: state.objective.orders.map((o) => ({ ...o })) }
        : { ...state.objective },
    exits: [...state.exits],
    events: [...state.events],
  }
}

export function occupies(cell: Cell): boolean {
  return (
    cell.color !== null ||
    cell.swirl ||
    cell.ingredient ||
    cell.special === 'color-bomb'
  )
}

export function isHole(cell: Cell): boolean {
  return (
    cell.frosting === 0 &&
    !cell.chocolate &&
    !cell.swirl &&
    cell.color === null &&
    !cell.ingredient &&
    cell.special !== 'color-bomb'
  )
}

export function isMatchable(cell: Cell): boolean {
  return cell.color !== null && !cell.swirl && !cell.chocolate && cell.frosting === 0
}

export function isPowerPlay(cell: Cell): boolean {
  return cell.special !== 'none'
}

export function isSwappable(cell: Cell): boolean {
  if (cell.frosting > 0) return false
  if (cell.chocolate) return false
  if (cell.swirl) return false
  return occupies(cell)
}

export function neighbors4(
  index: number,
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
): number[] {
  const { x, y } = xy(index, width)
  const out: number[] = []
  if (inBounds(x - 1, y, width, height)) out.push(idx(x - 1, y, width))
  if (inBounds(x + 1, y, width, height)) out.push(idx(x + 1, y, width))
  if (inBounds(x, y - 1, width, height)) out.push(idx(x, y - 1, width))
  if (inBounds(x, y + 1, width, height)) out.push(idx(x, y + 1, width))
  return out
}

export function adjacent(a: number, b: number, width = BOARD_WIDTH): boolean {
  return neighbors4(a, width).includes(b)
}

export function comboWord(combo: number, groups = 1): ComboWord | undefined {
  if (combo >= 7) return 'GALAXY BUSTER'
  if (combo === 6) return 'SUPERNOVA'
  if (combo === 5) return 'STELLAR'
  if (combo === 4) return 'SUPERSTAR'
  if (combo === 3) return 'SWEET'
  if (combo === 2 || (combo === 1 && groups >= 2)) return 'NICE'
  return undefined
}

export function blastForCombo(combo: number, groups = 1, destroyed = 0): BlastSize {
  if (combo >= 5 || groups >= 3 || destroyed >= 12) return 'L'
  if (combo >= 3 || groups >= 2 || destroyed >= 6) return 'M'
  return 'S'
}

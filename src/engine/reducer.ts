import { refillBoard, generateInitialCells } from './board'
import {
  clearOverlaysOnMatch,
  damageAdjacentBlockers,
  maybeSpreadChocolate,
  stripBlockerHealth,
  tickBombs,
} from './blockers'
import { convertMovesToSpecials, finaleMultiplier } from './finale'
import { applyGravity } from './gravity'
import { findMatches } from './match'
import {
  applyJellyClear,
  applyOrderProgress,
  collectIngredients,
  countJelly,
  objectiveComplete,
  syncJellyObjective,
} from './objectives'
import {
  allBoardIndices,
  colorIndices,
  comboForSpecials,
  giantCrossBlast,
  rowColCross,
  stripedLine,
  wrappedBlast,
} from './specials'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  adjacent,
  blastForCombo,
  cloneCell,
  cloneState,
  comboWord,
  emptyCell,
  isHole,
  isSwappable,
  type Cell,
  type EngineAction,
  type GameState,
  type LevelConfig,
  type SpecialKind,
  type StarColor,
} from './types'

const MAX_WAVES = 48

function wipePayload(cell: Cell): Cell {
  return {
    ...emptyCell(cell.jelly),
  }
}

function detonateQueue(
  cells: Cell[],
  initial: Iterable<number>,
  width: number,
  height: number,
  stripBlockersOnWipe = false,
): { cells: Cell[]; destroyed: Set<number> } {
  const next = cells.map(cloneCell)
  const destroyed = new Set<number>()
  const queue: number[] = [...initial]
  const detonatedSpecial = new Set<number>()

  while (queue.length) {
    const i = queue.pop()!
    if (i < 0 || i >= next.length) continue
    if (destroyed.has(i) && detonatedSpecial.has(i)) continue
    destroyed.add(i)

    const cell = cells[i]!
    if (cell.special !== 'none' && !detonatedSpecial.has(i)) {
      detonatedSpecial.add(i)
      if (cell.special === 'striped-h') {
        const blast = stripedLine(cells, i, 'h', width, height)
        for (const d of blast.destroyed) if (!destroyed.has(d)) queue.push(d)
      } else if (cell.special === 'striped-v') {
        const blast = stripedLine(cells, i, 'v', width, height)
        for (const d of blast.destroyed) if (!destroyed.has(d)) queue.push(d)
      } else if (cell.special === 'wrapped') {
        for (const d of wrappedBlast(i, 1, width, height)) if (!destroyed.has(d)) queue.push(d)
      } else if (cell.special === 'starfish') {
        const color = cell.color
        if (color) {
          for (const d of colorIndices(cells, color).slice(0, 4)) {
            if (!destroyed.has(d)) queue.push(d)
          }
        }
      } else if (cell.special === 'color-bomb') {
        const color = findNeighborColor(cells, i, width, height)
        if (color) {
          for (const d of colorIndices(cells, color)) if (!destroyed.has(d)) queue.push(d)
        } else {
          for (const d of allBoardIndices(width, height)) queue.push(d)
        }
      }
    }
  }

  if (stripBlockersOnWipe) {
    for (let i = 0; i < next.length; i++) destroyed.add(i)
  }

  return { cells: next, destroyed }
}

function findNeighborColor(cells: Cell[], i: number, width: number, height: number): StarColor | null {
  const { x, y } = { x: i % width, y: Math.floor(i / width) }
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [dx, dy] of dirs) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
    const c = cells[nx + ny * width]!
    if (c.color) return c.color
  }
  return cells.find((c) => c.color)?.color ?? null
}

function applyDestroy(state: GameState, destroyed: Set<number>, spawnedAt: Map<number, SpecialKind>): GameState {
  let cells = clearOverlaysOnMatch(state.cells, destroyed)
  cells = applyJellyClear(cells, destroyed)
  cells = damageAdjacentBlockers(cells, destroyed, state.width, state.height)

  const destroyedCells = [...destroyed].map((i) => state.cells[i]!)
  let chocolateDestroyed = state.chocolateDestroyedThisMove
  for (const i of destroyed) {
    if (state.cells[i]!.chocolate) chocolateDestroyed = true
    const jelly = cells[i]!.jelly
    const frosting = cells[i]!.frosting
    if (frosting > 0) {
      cells[i] = { ...emptyCell(jelly), frosting }
      continue
    }
    if (cells[i]!.chocolate && !state.cells[i]!.chocolate) {
      continue
    }
    cells[i] = wipePayload({ ...cells[i]!, jelly })
  }

  for (const [index, special] of spawnedAt) {
    const jelly = cells[index]!.jelly
    const color = state.cells[index]!.color
    cells[index] = {
      ...emptyCell(jelly),
      color: special === 'color-bomb' ? null : color,
      special,
    }
  }

  let objective = applyOrderProgress(
    state.objective,
    destroyedCells,
    [...spawnedAt.values()],
  )
  if (objective.type === 'jelly') {
    objective = { type: 'jelly', remaining: countJelly(cells) }
  }

  return {
    ...state,
    cells,
    objective,
    chocolateDestroyedThisMove: chocolateDestroyed,
  }
}

function resolveCascades(state: GameState, preferredOrigin?: number): GameState {
  let current = { ...state, events: [...state.events] }
  let combo = 0

  for (let wave = 0; wave < MAX_WAVES; wave++) {
    const matches = findMatches(current.cells, current.width, current.height, preferredOrigin)
    const specialsToPop = current.cells
      .map((c, i) => (c.special !== 'none' && matches.some((m) => m.indices.includes(i)) ? i : -1))
      .filter((i) => i >= 0)

    if (matches.length === 0 && specialsToPop.length === 0) break

    combo += 1
    const spawnMap = new Map<number, SpecialKind>()
    const matchSet = new Set<number>()
    for (const group of matches) {
      for (const i of group.indices) matchSet.add(i)
      if (group.kind !== 'none') {
        spawnMap.set(group.origin, group.kind)
      }
    }

    const { destroyed } = detonateQueue(
      current.cells,
      matchSet,
      current.width,
      current.height,
    )

    current = applyDestroy(current, destroyed, spawnMap)

    const collected = collectIngredients(current.cells, current.width, current.height, current.exits)
    current = { ...current, cells: collected.cells }
    if (collected.collected.length && current.objective.type === 'ingredient') {
      current = {
        ...current,
        objective: {
          type: 'ingredient',
          remaining: Math.max(0, current.objective.remaining - collected.collected.length),
        },
        events: [
          ...current.events,
          { type: 'ingredient-collect', indices: collected.collected },
        ],
      }
    }

    const grav = applyGravity(current.cells, current.width, current.height)
    current = { ...current, cells: grav.cells }
    const filled = refillBoard(current)
    current = { ...current, cells: filled.cells, rngState: filled.rngState }

    const blast = blastForCombo(combo)
    const word = comboWord(combo)
    const points = Math.round(
      destroyed.size * 40 * combo * (current.status === 'finale' ? finaleMultiplier(combo) : 1),
    )
    current = {
      ...current,
      score: current.score + points,
      combo,
      events: [
        ...current.events,
        {
          type: 'wave',
          combo,
          blast,
          destroyed: [...destroyed],
          spawnedSpecials: [...spawnMap.entries()].map(([index, special]) => ({ index, special })),
          gravity: grav.moves,
          refill: filled.refill,
          word,
        },
      ],
    }
    preferredOrigin = undefined
  }

  return current
}

function detonateAllSpecials(state: GameState): GameState {
  const specials = state.cells
    .map((c, i) => (c.special !== 'none' ? i : -1))
    .filter((i) => i >= 0)
  if (specials.length === 0) return state
  const { destroyed } = detonateQueue(state.cells, specials, state.width, state.height)
  let current = applyDestroy(state, destroyed, new Map())
  const collected = collectIngredients(current.cells, current.width, current.height, current.exits)
  current = { ...current, cells: collected.cells }
  if (collected.collected.length && current.objective.type === 'ingredient') {
    current = {
      ...current,
      objective: {
        type: 'ingredient',
        remaining: Math.max(0, current.objective.remaining - collected.collected.length),
      },
    }
  }
  const grav = applyGravity(current.cells, current.width, current.height)
  const filled = refillBoard({ ...current, cells: grav.cells })
  const combo = Math.max(1, current.combo + 1)
  return {
    ...current,
    cells: filled.cells,
    rngState: filled.rngState,
    combo,
    score: current.score + destroyed.size * 50 * combo,
    events: [
      ...current.events,
      {
        type: 'wave',
        combo,
        blast: blastForCombo(combo),
        destroyed: [...destroyed],
        spawnedSpecials: [],
        gravity: grav.moves,
        refill: filled.refill,
        word: comboWord(combo),
      },
    ],
  }
}

function swapCells(cells: Cell[], a: number, b: number): Cell[] {
  const next = cells.map(cloneCell)
  const jellyA = next[a]!.jelly
  const jellyB = next[b]!.jelly
  const cellA = { ...next[a]!, jelly: jellyB }
  const cellB = { ...next[b]!, jelly: jellyA }
  next[a] = cellB
  next[b] = cellA
  return next
}

function applySpecialCombo(state: GameState, a: number, b: number): GameState | null {
  const ca = state.cells[a]!
  const cb = state.cells[b]!
  const combo = comboForSpecials(ca.special, cb.special)
  if (!combo) return null

  let destroyed = new Set<number>()
  let cells = state.cells.map(cloneCell)
  let strip = false

  if (combo.type === 'cross') {
    destroyed = rowColCross(b, state.width, state.height)
  } else if (combo.type === 'giant-cross') {
    destroyed = giantCrossBlast(state.width, state.height)
  } else if (combo.type === 'wrapped-5') {
    destroyed = wrappedBlast(b, 2, state.width, state.height)
  } else if (combo.type === 'wipe') {
    destroyed = allBoardIndices(state.width, state.height)
    strip = true
  } else if (combo.type === 'bomb-stripe') {
    const color = (combo.colorFrom === 'a' ? ca : cb).color
    if (color) {
      for (const i of colorIndices(cells, color)) {
        cells[i] = {
          ...cells[i]!,
          special: i % 2 === 0 ? 'striped-h' : 'striped-v',
        }
        destroyed.add(i)
      }
    }
    destroyed.add(a)
    destroyed.add(b)
  } else if (combo.type === 'bomb-wrap') {
    const color = (combo.colorFrom === 'a' ? ca : cb).color
    if (color) {
      for (const i of colorIndices(cells, color)) {
        cells[i] = { ...cells[i]!, special: 'wrapped' }
        destroyed.add(i)
      }
    }
    destroyed.add(a)
    destroyed.add(b)
  } else if (combo.type === 'bomb-color') {
    const color = (combo.colorFrom === 'a' ? ca : cb).color
    destroyed.add(a)
    destroyed.add(b)
    if (color) for (const i of colorIndices(cells, color)) destroyed.add(i)
  }

  const detonated = detonateQueue({ ...state, cells }.cells, destroyed, state.width, state.height, strip)
  destroyed = detonated.destroyed
  let next: GameState = { ...state, cells }
  if (strip) next = { ...next, cells: stripBlockerHealth(next.cells) }
  next = applyDestroy(next, destroyed, new Map())
  const grav = applyGravity(next.cells, next.width, next.height)
  const filled = refillBoard({ ...next, cells: grav.cells })
  next = {
    ...next,
    cells: filled.cells,
    rngState: filled.rngState,
    combo: 1,
    score: next.score + destroyed.size * 80,
    events: [
      ...next.events,
      {
        type: 'wave',
        combo: 1,
        blast: 'L',
        destroyed: [...destroyed],
        spawnedSpecials: [],
        gravity: grav.moves,
        refill: filled.refill,
        word: 'SUPERNOVA',
      },
    ],
  }
  return resolveCascades(next)
}

function rewardForMove(state: GameState): GameState {
  const rawCoins = state.combo * 12 * Math.max(1, state.sectorId)
  const rawDust = state.combo * 4
  const coins = Math.min(state.rewardCap, rawCoins)
  const stardust = Math.min(Math.floor(state.rewardCap / 2), rawDust)
  return {
    ...state,
    coinsEarned: state.coinsEarned + coins,
    stardustEarned: state.stardustEarned + stardust,
    events: [
      ...state.events,
      { type: 'reward', coins, stardust, capped: rawCoins > state.rewardCap },
    ],
  }
}

function finishMove(state: GameState, consumedMove: boolean): GameState {
  let current = state
  if (consumedMove) {
    const spread = maybeSpreadChocolate(
      current.cells,
      current.rngState,
      current.width,
      current.height,
      current.chocolateDestroyedThisMove,
    )
    current = { ...current, cells: spread.cells, rngState: spread.rngState }
    if (spread.from !== undefined && spread.to !== undefined) {
      current = {
        ...current,
        events: [
          ...current.events,
          { type: 'chocolate-spread', from: spread.from, to: spread.to },
        ],
      }
    }
    const bombs = tickBombs(current.cells)
    current = {
      ...current,
      cells: bombs.cells,
      events: bombs.indices.length
        ? [...current.events, { type: 'bomb-tick', indices: bombs.indices }]
        : current.events,
    }
    if (bombs.exploded) {
      return {
        ...current,
        status: 'lost',
        events: [...current.events, { type: 'status', status: 'lost', reason: 'Star bomb detonated' }],
      }
    }
  }

  current = syncJellyObjective(current)

  if (objectiveComplete(current.objective)) {
    if (current.movesLeft > 0 && current.status === 'playing') {
      current = convertMovesToSpecials(current)
      current = detonateAllSpecials(current)
      current = resolveCascades(current)
      current = {
        ...current,
        status: 'won',
        events: [...current.events, { type: 'status', status: 'won' }],
      }
    } else {
      current = {
        ...current,
        status: 'won',
        events: [...current.events, { type: 'status', status: 'won' }],
      }
    }
    return current
  }

  if (consumedMove && current.movesLeft <= 0) {
    return {
      ...current,
      status: 'lost',
      events: [...current.events, { type: 'status', status: 'lost', reason: 'Out of moves' }],
    }
  }

  return current
}

export function createGame(config: LevelConfig): GameState {
  const { cells, rngState } = generateInitialCells(config)
  const exits =
    config.exits.length > 0
      ? Array.from({ length: BOARD_WIDTH }, (_, x) => config.exits.includes(x))
      : Array.from({ length: BOARD_WIDTH }, () => true)

  let state: GameState = {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    cells,
    movesLeft: config.moves,
    score: 0,
    combo: 0,
    streak: 0,
    seed: config.seed,
    rngState,
    colorCount: config.colorCount,
    objective: config.objective,
    status: 'playing',
    rewardCap: config.rewardCap,
    coinsEarned: 0,
    stardustEarned: 0,
    chocolateDestroyedThisMove: false,
    events: [],
    exits,
    levelId: config.id,
    sectorId: config.sectorId,
  }
  state = syncJellyObjective(state)
  state = resolveCascades(state)
  state = { ...state, events: [], combo: 0 }
  return state
}

export function reduce(state: GameState, action: EngineAction): GameState {
  if (state.status === 'won' || state.status === 'lost') return state
  if (state.status === 'finale' && action.type !== 'tick-finale') return state

  let current = cloneState(state)
  current.events = []
  current.combo = 0
  current.chocolateDestroyedThisMove = false

  if (action.type === 'add-moves') {
    return { ...current, movesLeft: current.movesLeft + action.count }
  }

  if (action.type === 'spawn-special') {
    const cells = current.cells.map(cloneCell)
    cells[action.index] = { ...cells[action.index]!, special: action.special }
    return { ...current, cells }
  }

  if (action.type === 'hammer') {
    const i = action.index
    const cell = current.cells[i]!
    if (cell.frosting === 0 && isHole(cell) && !cell.chocolate) return current
    const destroyed = new Set([i])
    current.movesLeft = Math.max(0, current.movesLeft)
    current = applyDestroy(current, destroyed, new Map())
    const grav = applyGravity(current.cells, current.width, current.height)
    const filled = refillBoard({ ...current, cells: grav.cells })
    current = {
      ...current,
      cells: filled.cells,
      rngState: filled.rngState,
      events: [
        {
          type: 'wave',
          combo: 1,
          blast: 'S',
          destroyed: [i],
          spawnedSpecials: [],
          gravity: grav.moves,
          refill: filled.refill,
        },
      ],
    }
    current = resolveCascades(current)
    current = rewardForMove(current)
    return finishMove(current, false)
  }

  if (action.type === 'color-splash') {
    const color = current.cells[action.index]!.color
    if (!color) return current
    const cells = current.cells.map(cloneCell)
    for (let i = 0; i < cells.length; i++) {
      if (cells[i]!.color && cells[i]!.special === 'none' && !cells[i]!.swirl) {
        cells[i] = { ...cells[i]!, color }
      }
    }
    current = { ...current, cells }
    current = resolveCascades(current)
    current = rewardForMove(current)
    return finishMove(current, false)
  }

  if (action.type === 'tick-finale') {
    current = detonateAllSpecials(current)
    current = resolveCascades(current)
    if (!current.cells.some((c) => c.special !== 'none')) {
      current = {
        ...current,
        status: 'won',
        events: [...current.events, { type: 'status', status: 'won' }],
      }
    }
    return current
  }

  if (action.type !== 'swap') return current
  const { a, b } = action
  if (!adjacent(a, b, current.width)) {
    return { ...current, events: [{ type: 'invalid-swap', a, b }] }
  }
  if (!isSwappable(current.cells[a]!) || !isSwappable(current.cells[b]!)) {
    return { ...current, events: [{ type: 'invalid-swap', a, b }] }
  }

  const specialCombo = applySpecialCombo(
    { ...current, cells: swapCells(current.cells, a, b), events: [{ type: 'swap', a, b }] },
    a,
    b,
  )
  if (specialCombo) {
    let next = { ...specialCombo, movesLeft: current.movesLeft - 1, streak: current.streak + 1 }
    next = rewardForMove(next)
    return finishMove(next, true)
  }

  const swapped = swapCells(current.cells, a, b)
  const matches = findMatches(swapped, current.width, current.height, b)
  if (matches.length === 0 && current.cells[a]!.special !== 'color-bomb' && current.cells[b]!.special !== 'color-bomb') {
    return { ...current, events: [{ type: 'invalid-swap', a, b }] }
  }

  current = {
    ...current,
    cells: swapped,
    movesLeft: current.movesLeft - 1,
    streak: current.streak + 1,
    events: [{ type: 'swap', a, b }],
  }
  current = resolveCascades(current, b)
  current = rewardForMove(current)
  return finishMove(current, true)
}

export function assertNoHoles(state: GameState): void {
  const hole = state.cells.findIndex((c) => isHole(c))
  if (hole >= 0) {
    throw new Error(`Hole left at index ${hole} after resolve`)
  }
}

export function serializeBoard(state: GameState) {
  return {
    levelId: state.levelId,
    movesLeft: state.movesLeft,
    score: state.score,
    status: state.status,
    combo: state.combo,
    streak: state.streak,
    rngState: state.rngState,
    objective: state.objective,
    cells: state.cells.map((c) => ({
      color: c.color,
      special: c.special,
      frosting: c.frosting,
      lock: c.lock,
      swirl: c.swirl,
      chocolate: c.chocolate,
      bomb: c.bomb,
      jelly: c.jelly,
      ingredient: c.ingredient,
    })),
  }
}

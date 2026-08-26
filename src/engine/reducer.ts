import { playableHasHoles, refillBoard, generateInitialCells } from './board'
import {
  clearOverlaysOnMatch,
  damageAdjacentBlockers,
  maybeSpreadChocolate,
  tickBombs,
} from './blockers'
import { convertMovesToSpecials, finaleMultiplier } from './finale'
import { applyGravity } from './gravity'
import { rngInt } from './prng'
import { findMatches, hasAnyMatch, hasLegalSwap, type MatchOrigin } from './match'
import {
  applyJellyClear,
  applyOrderProgress,
  collectIngredients,
  countJelly,
  objectiveComplete,
  syncJellyObjective,
} from './objectives'
import { colorIndices, comboForSpecials, rowColCross, stripedLine, SUN_BLAST_RADIUS, TWIN_SUN_BLAST_RADIUS, wrappedBlast } from './specials'
import { rollKitDrop } from '~/data/kit'
import { cometTailMultiplier, sectorDifficulty } from '~/data/difficulty'
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
  isMatchable,
  isSwappable,
  type Cell,
  type EngineAction,
  type GameState,
  type LevelConfig,
  type SpecialKind,
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
      if (cell.special === 'striped-h' || cell.special === 'striped-v') {
        const axis = cell.special === 'striped-h' ? 'h' : 'v'
        for (const d of stripedLine(cells, i, axis, width, height).destroyed) {
          if (!destroyed.has(d)) queue.push(d)
        }
      } else if (cell.special === 'color-bomb') {
        const color = cell.color
        if (color) {
          for (const d of colorIndices(cells, color)) {
            if (!destroyed.has(d)) queue.push(d)
          }
        } else {
          for (const d of wrappedBlast(i, SUN_BLAST_RADIUS, width, height)) {
            if (!destroyed.has(d)) queue.push(d)
          }
        }
      } else {
        for (const d of wrappedBlast(i, SUN_BLAST_RADIUS, width, height)) {
          if (!destroyed.has(d)) queue.push(d)
        }
      }
    }
  }

  if (stripBlockersOnWipe) {
    for (let i = 0; i < next.length; i++) destroyed.add(i)
  }

  return { cells: next, destroyed }
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
    const color = special === 'color-bomb' ? null : state.cells[index]!.color
    cells[index] = {
      ...emptyCell(jelly),
      color,
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

function blastAndRefill(state: GameState, seeds: Iterable<number>, combo = 1): GameState {
  const { destroyed } = detonateQueue(state.cells, seeds, state.width, state.height)
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
      events: [
        ...current.events,
        { type: 'ingredient-collect', indices: collected.collected },
      ],
    }
  }
  const grav = applyGravity(current.cells, current.width, current.height)
  current = { ...current, cells: grav.cells }
  const filled = refillBoard(current)
  const blast = blastForCombo(combo, 1, destroyed.size)
  current = {
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
        blast,
        destroyed: [...destroyed],
        spawnedSpecials: [],
        gravity: grav.moves,
        refill: filled.refill,
        groups: 1,
        word: comboWord(combo),
      },
    ],
  }
  return resolveCascades(current)
}

function resolveCascades(state: GameState, preferredOrigin?: MatchOrigin): GameState {
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

    const waveCells = current.cells
    const { destroyed } = detonateQueue(
      waveCells,
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

    const groups = Math.max(1, matches.length)
    const blast = blastForCombo(combo, groups, destroyed.size)
    const word = comboWord(combo, groups)
    const points = Math.round(
      destroyed.size *
        40 *
        combo *
        cometTailMultiplier(current.cometTail) *
        (current.status === 'finale' ? finaleMultiplier(combo) : 1),
    )
    const sunHit = [...destroyed].some((i) => waveCells[i]?.special !== 'none')
    current = {
      ...current,
      score: current.score + points,
      combo,
      events: [
        ...current.events,
        ...(sunHit ? [{ type: 'special-combo' as const, kind: 'sun' }] : []),
        {
          type: 'wave',
          combo,
          blast,
          destroyed: [...destroyed],
          spawnedSpecials: [...spawnMap.entries()].map(([index, special]) => ({ index, special })),
          gravity: grav.moves,
          refill: filled.refill,
          groups,
          word,
        },
      ],
    }
    preferredOrigin = undefined
  }

  if (playableHasHoles(current.cells)) {
    const sealed = refillBoard(current)
    current = { ...current, cells: sealed.cells, rngState: sealed.rngState }
    const last = current.events.at(-1)
    if (last && last.type === 'wave' && sealed.refill.length) {
      last.refill = [...last.refill, ...sealed.refill]
    }
  }

  return current
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

  const cells = state.cells.map(cloneCell)
  let seeds: Set<number>

  switch (combo.type) {
    case 'striped-cross': {
      seeds = rowColCross(b, state.width, state.height)
      seeds.add(a)
      break
    }
    case 'striped-wide': {
      const { x, y } = { x: b % state.width, y: Math.floor(b / state.width) }
      seeds = new Set<number>()
      for (let row = Math.max(0, y - 1); row <= Math.min(state.height - 1, y + 1); row++)
        for (let col = 0; col < state.width; col++) seeds.add(col + row * state.width)
      for (let col = Math.max(0, x - 1); col <= Math.min(state.width - 1, x + 1); col++)
        for (let row = 0; row < state.height; row++) seeds.add(col + row * state.width)
      seeds.add(a)
      break
    }
    case 'wrapped-5': {
      seeds = wrappedBlast(b, TWIN_SUN_BLAST_RADIUS, state.width, state.height)
      seeds.add(a)
      break
    }
    case 'color-bomb-striped': {
      const bombIdx = ca.special === 'color-bomb' ? a : b
      const otherIdx = bombIdx === a ? b : a
      const targetColor = cells[otherIdx]!.color
      seeds = new Set<number>([a, b])
      if (targetColor) {
        for (const i of colorIndices(cells, targetColor)) {
          cells[i] = { ...cells[i]!, special: 'striped-h' }
          seeds.add(i)
        }
      }
      break
    }
    case 'color-bomb-wrapped': {
      const bombIdx = ca.special === 'color-bomb' ? a : b
      const otherIdx = bombIdx === a ? b : a
      const targetColor = cells[otherIdx]!.color
      seeds = new Set<number>([a, b])
      if (targetColor) {
        for (const i of colorIndices(cells, targetColor)) {
          cells[i] = { ...cells[i]!, special: 'wrapped' }
          seeds.add(i)
        }
      }
      break
    }
    case 'color-bomb-single': {
      const bombIdx = ca.special === 'color-bomb' ? a : b
      const otherIdx = bombIdx === a ? b : a
      const targetColor = cells[otherIdx]!.color
      seeds = new Set<number>([a, b])
      if (targetColor) {
        for (const i of colorIndices(cells, targetColor)) {
          seeds.add(i)
        }
      }
      break
    }
    case 'color-bomb-double': {
      seeds = new Set<number>()
      for (let i = 0; i < cells.length; i++) seeds.add(i)
      break
    }
    default:
      seeds = wrappedBlast(b, TWIN_SUN_BLAST_RADIUS, state.width, state.height)
      seeds.add(a)
  }

  const detonated = detonateQueue(cells, seeds, state.width, state.height)
  const destroyed = detonated.destroyed
  let next: GameState = { ...state, cells }
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
      { type: 'special-combo', kind: combo.type },
      {
        type: 'wave',
        combo: 1,
        blast: 'L',
        destroyed: [...destroyed],
        spawnedSpecials: [],
        gravity: grav.moves,
        refill: filled.refill,
        groups: 1,
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
      // Stay in finale so the winning cascade can play, then suns ignite one at a time.
      return convertMovesToSpecials(current)
    }
    return {
      ...current,
      status: 'won',
      events: [...current.events, { type: 'status', status: 'won' }],
    }
  }

  if (consumedMove && current.movesLeft <= 0) {
    return {
      ...current,
      status: 'lost',
      events: [...current.events, { type: 'status', status: 'lost', reason: 'Out of moves' }],
    }
  }

  return maybeDropKit(current)
}

function maybeDropKit(state: GameState): GameState {
  if (state.status !== 'playing' || state.levelId <= 0) return state
  const wave = [...state.events].reverse().find((e) => e.type === 'wave')
  if (!wave || wave.type !== 'wave' || wave.destroyed.length < 3) return state
  const already = state.kitDrops ?? 0
  const forceFirst = already === 0 && state.sectorId <= 2
  const roll = rollKitDrop(state.rngState, state.sectorId, wave.combo, wave.blast, already, forceFirst)
  if (!roll.item) return { ...state, rngState: roll.rngState }
  const pick = wave.destroyed[Math.min(wave.destroyed.length - 1, Math.floor(roll.indexJitter * wave.destroyed.length))]!
  return {
    ...state,
    rngState: roll.rngState,
    kitDrops: already + 1,
    events: [...state.events, { type: 'kit-drop', item: roll.item, index: pick }],
  }
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
    cometTail: 0,
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
    timeLimit: config.timeLimit ?? sectorDifficulty(config.sectorId).timeLimit,
    timeLeft: config.timeLimit ?? sectorDifficulty(config.sectorId).timeLimit,
    kitDrops: 0,
  }
  state = syncJellyObjective(state)
  state = resolveCascades(state)
  if (hasAnyMatch(state.cells, state.width, state.height) || !hasLegalSwap(state.cells, state.width, state.height)) {
    const retry = generateInitialCells({ ...config, seed: (config.seed + 7919) | 0 })
    state = { ...state, cells: retry.cells, rngState: retry.rngState }
    state = syncJellyObjective(state)
    state = resolveCascades(state)
  }
  state = { ...state, events: [], combo: 0 }
  return state
}

export function reduce(state: GameState, action: EngineAction): GameState {
  if (action.type === 'resume') {
    if (state.status !== 'lost') return state
    return {
      ...state,
      status: 'playing',
      movesLeft: state.movesLeft + (action.extraMoves ?? 0),
      timeLeft: Math.max(1, state.timeLeft) + (action.extraTime ?? 0),
      events: [],
    }
  }
  if (state.status === 'won' || state.status === 'lost') return state
  if (state.status === 'finale' && action.type !== 'tick-finale') return state

  if (action.type === 'decay-comet-tail') {
    if (state.status !== 'playing' || state.cometTail === 0) return state
    return {
      ...state,
      cometTail: 0,
      events: [{ type: 'comet-tail', value: 0, decayed: true }],
    }
  }

  if (action.type === 'tick-clock') {
    if (state.status !== 'playing') return state
    const timeLeft = Math.max(0, state.timeLeft - 1)
    // Keep the same events array so a 1s tick does not retrigger Board/Play effects.
    if (timeLeft > 0) return { ...state, timeLeft }
    if (objectiveComplete(state.objective)) {
      return finishMove({ ...cloneState(state), timeLeft: 0 }, false)
    }
    return {
      ...state,
      timeLeft: 0,
      status: 'lost',
      events: [{ type: 'status', status: 'lost', reason: 'Orbit clock expired' }],
    }
  }

  let current = cloneState(state)
  current.events = []
  current.combo = 0
  current.chocolateDestroyedThisMove = false

  if (action.type === 'add-moves') {
    return { ...current, movesLeft: current.movesLeft + action.count }
  }

  if (action.type === 'spawn-special') {
    const cells = current.cells.map(cloneCell)
    cells[action.index] = {
      ...cells[action.index]!,
      special: action.special,
    }
    return { ...current, cells }
  }

  if (action.type === 'ignite-special') {
    const cell = current.cells[action.index]
    if (!cell || cell.special === 'none' || !isSwappable(cell)) {
      return { ...current, events: [{ type: 'invalid-swap', a: action.index, b: action.index }] }
    }
    current = blastAndRefill(current, [action.index], 1)
    current = { ...current, movesLeft: Math.max(0, current.movesLeft - 1) }
    current = rewardForMove(current)
    return finishMove(current, true)
  }

  if (action.type === 'hammer' || action.type === 'well') {
    const i = action.index
    const cell = current.cells[i]!
    if (cell.frosting === 0 && isHole(cell) && !cell.chocolate) return current
    if (action.type === 'hammer' && cell.special !== 'none' && isSwappable(cell)) {
      current = blastAndRefill(current, [i], 1)
      current = rewardForMove(current)
      return finishMove(current, false)
    }
    const destroyed =
      action.type === 'well' ? wrappedBlast(i, 1, current.width, current.height) : new Set([i])
    if (action.type === 'well') {
      const seeds = [...destroyed].filter((j) => {
        const hit = current.cells[j]
        return Boolean(hit && hit.special !== 'none' && isSwappable(hit))
      })
      if (seeds.length) {
        current = blastAndRefill(current, seeds, 1)
        current = rewardForMove(current)
        return finishMove(current, false)
      }
    }
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
          blast: action.type === 'well' ? 'M' : 'S',
          destroyed: [...destroyed],
          spawnedSpecials: [],
          gravity: grav.moves,
          refill: filled.refill,
          groups: 1,
        },
      ],
    }
    current = resolveCascades(current)
    current = rewardForMove(current)
    return finishMove(current, false)
  }

  if (action.type === 'shuffle') {
    const cells = current.cells.map(cloneCell)
    const idxs: number[] = []
    for (let i = 0; i < cells.length; i++) {
      if (isMatchable(cells[i]!) && cells[i]!.special === 'none') idxs.push(i)
    }
    let rng = current.rngState
    for (let i = idxs.length - 1; i > 0; i--) {
      const r = rngInt(rng, i + 1)
      rng = r.state
      const a = idxs[i]!
      const b = idxs[r.n]!
      const colorA = cells[a]!.color
      cells[a] = { ...cells[a]!, color: cells[b]!.color }
      cells[b] = { ...cells[b]!, color: colorA }
    }
    current = { ...current, cells, rngState: rng }
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
    const nextSun = current.cells.findIndex((c) => c.special !== 'none')
    if (nextSun < 0) {
      return {
        ...current,
        status: 'won',
        events: [...current.events, { type: 'status', status: 'won' }],
      }
    }
    current = blastAndRefill(current, [nextSun], Math.max(1, current.combo + 1))
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
    {
      ...current,
      cells: swapCells(current.cells, a, b),
      cometTail: current.cometTail + 1,
      events: [{ type: 'swap', a, b }],
    },
    a,
    b,
  )
  if (specialCombo) {
    let next = { ...specialCombo, movesLeft: current.movesLeft - 1, cometTail: current.cometTail + 1 }
    next = rewardForMove(next)
    return finishMove(next, true)
  }

  const swapped = swapCells(current.cells, a, b)
  const matches = findMatches(swapped, current.width, current.height, [a, b])
  if (matches.length === 0) {
    return { ...current, events: [{ type: 'invalid-swap', a, b }] }
  }

  current = {
    ...current,
    cells: swapped,
    movesLeft: current.movesLeft - 1,
    cometTail: current.cometTail + 1,
    events: [{ type: 'swap', a, b }],
  }
  current = resolveCascades(current, [a, b])
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
    cometTail: state.cometTail,
    timeLeft: state.timeLeft,
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

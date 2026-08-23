import type { Cell, GameState, Objective, SpecialKind, StarColor } from './types'

export function countJelly(cells: Cell[]): number {
  return cells.reduce((sum, c) => sum + c.jelly, 0)
}

export function applyJellyClear(cells: Cell[], destroyed: Set<number>): Cell[] {
  return cells.map((c, i) => {
    if (!destroyed.has(i) || c.jelly <= 0) return c
    return { ...c, jelly: c.jelly - 1 }
  })
}

export function collectIngredients(
  cells: Cell[],
  width: number,
  height: number,
  exits: boolean[],
): { cells: Cell[]; collected: number[] } {
  const next = cells.map((c) => ({ ...c }))
  const collected: number[] = []
  for (let x = 0; x < width; x++) {
    const i = x + (height - 1) * width
    if (next[i]!.ingredient && (exits.length === 0 || exits[x])) {
      collected.push(i)
      const jelly = next[i]!.jelly
      next[i] = {
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
  }
  return { cells: next, collected }
}

export function applyOrderProgress(
  objective: Objective,
  destroyedCells: Cell[],
  spawnedSpecials: SpecialKind[],
): Objective {
  if (objective.type !== 'order') return objective
  const orders = objective.orders.map((o) => ({ ...o }))

  for (const cell of destroyedCells) {
    for (const order of orders) {
      if (order.count <= 0) continue
      if (order.color && cell.color === order.color && cell.special === 'none') {
        order.count -= 1
      }
      if (order.special && cell.special !== 'none') {
        order.count -= 1
      }
    }
  }
  for (const special of spawnedSpecials) {
    for (const order of orders) {
      if (order.count <= 0) continue
      if (order.special && special !== 'none') order.count -= 1
    }
  }

  return { type: 'order', orders }
}

export function objectiveComplete(objective: Objective): boolean {
  if (objective.type === 'jelly') return objective.remaining <= 0
  if (objective.type === 'ingredient') return objective.remaining <= 0
  return objective.orders.every((o) => o.count <= 0)
}

export function describeObjective(objective: Objective): string {
  if (objective.type === 'jelly') {
    return objective.remaining <= 0
      ? 'All blue glows cleared'
      : `Clear ${objective.remaining} blue glow${objective.remaining === 1 ? '' : 's'}`
  }
  if (objective.type === 'ingredient') {
    return objective.remaining <= 0
      ? 'All shards delivered'
      : `Slide ${objective.remaining} meteor shard${objective.remaining === 1 ? '' : 's'} to the bottom`
  }
  return objective.orders
    .map((o) => {
      if (o.special) return `Make ${o.count} sun${o.count === 1 ? '' : 's'} (match 4 of one color)`
      return `Pop ${o.count} ${labelColor(o.color!)} stars`
    })
    .join(' · ')
}

export function howToClear(objective: Objective): string {
  if (objective.type === 'jelly') {
    return 'Win by bursting stars on the bright cyan wells. Score does not finish the stage.'
  }
  if (objective.type === 'ingredient') {
    return 'Win by sliding the meteor shards (▼) down to the bottom row. Regular matches only help if they drop a shard.'
  }
  if (objective.orders.some((o) => o.special)) {
    return 'Win by matching 4+ of one color to spawn a sun. Challenges are optional.'
  }
  return 'Win by popping the listed star colors. Challenges are optional shop bonuses.'
}

function labelSpecial(_s: SpecialKind): string {
  return 'suns'
}

function labelColor(c: StarColor): string {
  return c
}

export function syncJellyObjective(state: GameState): GameState {
  if (state.objective.type !== 'jelly') return state
  return { ...state, objective: { type: 'jelly', remaining: countJelly(state.cells) } }
}

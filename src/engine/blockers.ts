import { cloneCell, neighbors4, type Cell } from './types'
import { rngPick } from './prng'

export function damageAdjacentBlockers(
  cells: Cell[],
  destroyed: Set<number>,
  width: number,
  height: number,
): Cell[] {
  const next = cells.map(cloneCell)
  const damaged = new Set<number>()

  for (const i of destroyed) {
    for (const n of neighbors4(i, width, height)) {
      if (destroyed.has(n) || damaged.has(n)) continue
      const cell = next[n]!
      if (cell.frosting > 0) {
        cell.frosting -= 1
        damaged.add(n)
      }
      if (cell.marmalade) {
        cell.marmalade = false
        damaged.add(n)
      }
      if (cell.chocolate && !destroyed.has(n)) {
        cell.chocolate = false
        damaged.add(n)
      }
    }
  }

  return next
}

export function clearOverlaysOnMatch(cells: Cell[], matched: Set<number>): Cell[] {
  const next = cells.map(cloneCell)
  for (const i of matched) {
    if (next[i]!.lock) next[i]!.lock = false
    if (next[i]!.marmalade) next[i]!.marmalade = false
  }
  return next
}

export function maybeSpreadChocolate(
  cells: Cell[],
  rngState: number,
  width: number,
  height: number,
  skip: boolean,
): { cells: Cell[]; rngState: number; from?: number; to?: number } {
  if (skip) return { cells, rngState }

  const chocolateAt: number[] = []
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]!.chocolate) chocolateAt.push(i)
  }
  if (chocolateAt.length === 0) return { cells, rngState }

  const candidates: Array<{ from: number; to: number }> = []
  for (const from of chocolateAt) {
    for (const to of neighbors4(from, width, height)) {
      const c = cells[to]!
      if (
        c.color &&
        c.special === 'none' &&
        !c.swirl &&
        !c.chocolate &&
        !c.frosting &&
        !c.lock &&
        !c.ingredient
      ) {
        candidates.push({ from, to })
      }
    }
  }
  if (candidates.length === 0) return { cells, rngState }

  const pick = rngPick(rngState, candidates)
  const next = cells.map(cloneCell)
  const target = next[pick.item.to]!
  next[pick.item.to] = {
    ...target,
    color: null,
    special: 'none',
    chocolate: true,
    swirl: false,
    ingredient: false,
    bomb: 0,
    marmalade: false,
    lock: false,
  }
  return { cells: next, rngState: pick.state, from: pick.item.from, to: pick.item.to }
}

export function tickBombs(cells: Cell[]): { cells: Cell[]; exploded: boolean; indices: number[] } {
  const next = cells.map(cloneCell)
  const indices: number[] = []
  let exploded = false
  for (let i = 0; i < next.length; i++) {
    if (next[i]!.bomb > 0) {
      next[i]!.bomb -= 1
      indices.push(i)
      if (next[i]!.bomb <= 0) exploded = true
    }
  }
  return { cells: next, exploded, indices }
}

export function stripBlockerHealth(cells: Cell[]): Cell[] {
  return cells.map((c) => {
    if (c.frosting > 0) return { ...c, frosting: c.frosting - 1 }
    if (c.chocolate) return { ...c, chocolate: false }
    if (c.lock) return { ...c, lock: false }
    if (c.marmalade) return { ...c, marmalade: false }
    return c
  })
}

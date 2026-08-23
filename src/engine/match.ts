import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  isMatchable,
  type Cell,
  type SpecialKind,
  type StarColor,
} from './types'

export interface MatchGroup {
  indices: number[]
  color: StarColor
  kind: Exclude<SpecialKind, 'starfish'>
  origin: number
}

interface Run {
  indices: number[]
  color: StarColor
  axis: 'h' | 'v'
}

function collectRuns(cells: Cell[], width = BOARD_WIDTH, height = BOARD_HEIGHT): Run[] {
  const runs: Run[] = []

  for (let y = 0; y < height; y++) {
    let x = 0
    while (x < width) {
      const start = x
      const i = x + y * width
      const cell = cells[i]!
      if (!isMatchable(cell) || !cell.color) {
        x++
        continue
      }
      const color = cell.color
      x++
      while (x < width) {
        const n = cells[x + y * width]!
        if (!isMatchable(n) || n.color !== color) break
        x++
      }
      if (x - start >= 3) {
        const indices = []
        for (let k = start; k < x; k++) indices.push(k + y * width)
        runs.push({ indices, color, axis: 'h' })
      }
    }
  }

  for (let x = 0; x < width; x++) {
    let y = 0
    while (y < height) {
      const start = y
      const i = x + y * width
      const cell = cells[i]!
      if (!isMatchable(cell) || !cell.color) {
        y++
        continue
      }
      const color = cell.color
      y++
      while (y < height) {
        const n = cells[x + y * width]!
        if (!isMatchable(n) || n.color !== color) break
        y++
      }
      if (y - start >= 3) {
        const indices = []
        for (let k = start; k < y; k++) indices.push(x + k * width)
        runs.push({ indices, color, axis: 'v' })
      }
    }
  }

  return runs
}

export type MatchOrigin = number | readonly number[]

function originSet(origin?: MatchOrigin): Set<number> | undefined {
  if (origin === undefined) return undefined
  return new Set(typeof origin === 'number' ? [origin] : origin)
}

function collectSquares(
  cells: Cell[],
  width: number,
  height: number,
  origins?: Set<number>,
): Run[] {
  const runs: Run[] = []
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idxs = [x + y * width, x + 1 + y * width, x + (y + 1) * width, x + 1 + (y + 1) * width]
      const matchable = idxs
        .map((i) => ({ i, cell: cells[i]! }))
        .filter(({ cell }) => isMatchable(cell) && cell.color)
      const byColor = new Map<StarColor, number[]>()
      for (const { i, cell } of matchable) {
        const color = cell.color!
        const list = byColor.get(color) ?? []
        list.push(i)
        byColor.set(color, list)
      }
      for (const [color, indices] of byColor) {
        // A full 2×2 always bursts. An L of three only counts on the swipe that made it —
        // otherwise gravity keeps completing new corners and one play never settles.
        if (indices.length >= 4) runs.push({ indices, color, axis: 'h' })
        else if (indices.length >= 3 && origins && indices.some((i) => origins.has(i))) {
          runs.push({ indices, color, axis: 'h' })
        }
      }
    }
  }
  return runs
}

function classify(
  indices: number[],
  color: StarColor,
  hMax: number,
  vMax: number,
  preferredOrigin?: MatchOrigin,
): MatchGroup {
  let kind: MatchGroup['kind'] = 'none'
  if (hMax >= 4 || vMax >= 4 || (hMax >= 3 && vMax >= 3) || indices.length >= 4) kind = 'wrapped'
  else kind = 'none'

  const origins = originSet(preferredOrigin)
  const origin = origins
    ? (indices.find((i) => origins.has(i)) ?? indices[Math.floor(indices.length / 2)]!)
    : indices[Math.floor(indices.length / 2)]!

  return { indices, color, kind, origin }
}

export function findMatches(
  cells: Cell[],
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  preferredOrigin?: MatchOrigin,
): MatchGroup[] {
  const origins = originSet(preferredOrigin)
  const runs = [...collectRuns(cells, width, height), ...collectSquares(cells, width, height, origins)]
  if (runs.length === 0) return []

  const groups: MatchGroup[] = []
  const used = new Set<number>()

  const byColor = new Map<StarColor, Run[]>()
  for (const run of runs) {
    const list = byColor.get(run.color) ?? []
    list.push(run)
    byColor.set(run.color, list)
  }

  for (const [color, colorRuns] of byColor) {
    const cellSet = new Set<number>()
    for (const run of colorRuns) for (const i of run.indices) cellSet.add(i)
    const remaining = new Set(cellSet)

    while (remaining.size) {
      const start = remaining.values().next().value as number
      const stack = [start]
      const component: number[] = []
      remaining.delete(start)
      while (stack.length) {
        const cur = stack.pop()!
        component.push(cur)
        const { x, y } = { x: cur % width, y: Math.floor(cur / width) }
        const neigh = [
          x > 0 ? cur - 1 : -1,
          x < width - 1 ? cur + 1 : -1,
          y > 0 ? cur - width : -1,
          y < height - 1 ? cur + width : -1,
        ]
        for (const n of neigh) {
          if (n >= 0 && remaining.has(n)) {
            remaining.delete(n)
            stack.push(n)
          }
        }
      }

      const involved = colorRuns.filter((r) => r.indices.some((i) => component.includes(i)))
      const hMax = involved
        .filter((r) => r.axis === 'h')
        .reduce((m, r) => Math.max(m, r.indices.length), 0)
      const vMax = involved
        .filter((r) => r.axis === 'v')
        .reduce((m, r) => Math.max(m, r.indices.length), 0)

      const unique = [...new Set(involved.flatMap((r) => r.indices))]
      groups.push(classify(unique, color, hMax, vMax, preferredOrigin))
      for (const i of unique) used.add(i)
    }
  }

  void used
  return groups
}

export function hasAnyMatch(cells: Cell[], width = BOARD_WIDTH, height = BOARD_HEIGHT): boolean {
  return findMatches(cells, width, height).length > 0
}

export function hasLegalSwap(cells: Cell[], width = BOARD_WIDTH, height = BOARD_HEIGHT): boolean {
  const swap = (a: number, b: number) => {
    const next = cells.slice()
    const tmp = next[a]!
    next[a] = next[b]!
    next[b] = tmp
    return next
  }
  for (let i = 0; i < cells.length; i++) {
    if (!isMatchable(cells[i]!)) continue
    const x = i % width
    const y = Math.floor(i / width)
    const neighbors = [x + 1 < width ? i + 1 : -1, y + 1 < height ? i + width : -1]
    for (const j of neighbors) {
      if (j < 0 || !isMatchable(cells[j]!)) continue
      if (findMatches(swap(i, j), width, height, [i, j]).length > 0) return true
    }
  }
  return false
}

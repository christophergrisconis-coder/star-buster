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

function classify(
  indices: number[],
  color: StarColor,
  hMax: number,
  vMax: number,
  preferredOrigin?: number,
): MatchGroup {
  let kind: MatchGroup['kind'] = 'none'
  if (hMax >= 5 || vMax >= 5) kind = 'color-bomb'
  else if (hMax >= 3 && vMax >= 3) kind = 'wrapped'
  else if (hMax >= 4) kind = 'striped-v'
  else if (vMax >= 4) kind = 'striped-h'
  else kind = 'none'

  const origin =
    preferredOrigin !== undefined && indices.includes(preferredOrigin)
      ? preferredOrigin
      : indices[Math.floor(indices.length / 2)]!

  return { indices, color, kind, origin }
}

export function findMatches(
  cells: Cell[],
  width = BOARD_WIDTH,
  height = BOARD_HEIGHT,
  preferredOrigin?: number,
): MatchGroup[] {
  const runs = collectRuns(cells, width, height)
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

export function hasAnyMatch(cells: Cell[]): boolean {
  return findMatches(cells).length > 0
}

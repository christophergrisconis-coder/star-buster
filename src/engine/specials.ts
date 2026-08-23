import { idx, inBounds, xy, type Cell, type SpecialKind, type StarColor } from './types'

export interface BlastResult {
  destroyed: Set<number>
  truncated: boolean
}

function addIfExists(set: Set<number>, x: number, y: number, width: number, height: number) {
  if (inBounds(x, y, width, height)) set.add(idx(x, y, width))
}

export function stripedLine(
  cells: Cell[],
  origin: number,
  axis: 'h' | 'v',
  width: number,
  height: number,
): BlastResult {
  const { x, y } = xy(origin, width)
  const destroyed = new Set<number>([origin])
  let truncated = false

  const walk = (step: number) => {
    if (axis === 'h') {
      for (let nx = x + step; nx >= 0 && nx < width; nx += step) {
        const i = idx(nx, y, width)
        const cell = cells[i]!
        destroyed.add(i)
        if (cell.swirl) {
          truncated = true
          break
        }
      }
    } else {
      for (let ny = y + step; ny >= 0 && ny < height; ny += step) {
        const i = idx(x, ny, width)
        const cell = cells[i]!
        destroyed.add(i)
        if (cell.swirl) {
          truncated = true
          break
        }
      }
    }
  }

  walk(-1)
  walk(1)
  return { destroyed, truncated }
}

export function wrappedBlast(
  origin: number,
  radius: number,
  width: number,
  height: number,
): Set<number> {
  const { x, y } = xy(origin, width)
  const destroyed = new Set<number>()
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      addIfExists(destroyed, x + dx, y + dy, width, height)
    }
  }
  return destroyed
}

export function giantCrossBlast(width: number, height: number): Set<number> {
  const destroyed = new Set<number>()
  const midY = [Math.floor(height / 2) - 1, Math.floor(height / 2), Math.floor(height / 2) + 1]
  const midX = [Math.floor(width / 2) - 1, Math.floor(width / 2), Math.floor(width / 2) + 1]
  for (let y = 0; y < height; y++) {
    for (const x of midX) {
      if (x >= 0 && x < width) destroyed.add(idx(x, y, width))
    }
  }
  for (let x = 0; x < width; x++) {
    for (const y of midY) {
      if (y >= 0 && y < height) destroyed.add(idx(x, y, width))
    }
  }
  return destroyed
}

export function rowColCross(origin: number, width: number, height: number): Set<number> {
  const { x, y } = xy(origin, width)
  const destroyed = new Set<number>()
  for (let nx = 0; nx < width; nx++) destroyed.add(idx(nx, y, width))
  for (let ny = 0; ny < height; ny++) destroyed.add(idx(x, ny, width))
  return destroyed
}

export function colorIndices(cells: Cell[], color: StarColor): number[] {
  const out: number[] = []
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]!.color === color && !cells[i]!.swirl && !cells[i]!.chocolate && cells[i]!.frosting === 0) {
      out.push(i)
    }
  }
  return out
}

export function allBoardIndices(width: number, height: number): Set<number> {
  const s = new Set<number>()
  for (let i = 0; i < width * height; i++) s.add(i)
  return s
}

export const SUN_BLAST_RADIUS = 1
export const TWIN_SUN_BLAST_RADIUS = 2

export function isSunSpecial(special: SpecialKind): boolean {
  return special !== 'none'
}

export function comboForSpecials(
  a: SpecialKind,
  b: SpecialKind,
): { type: 'wrapped-5' } | null {
  if (isSunSpecial(a) && isSunSpecial(b)) return { type: 'wrapped-5' }
  return null
}

import { cloneCell, isHole, occupies, type Cell, type GravityMove } from './types'

function barrier(cell: Cell): boolean {
  return cell.frosting > 0 || cell.chocolate || (cell.lock && occupies(cell))
}

export function applyGravity(
  cells: Cell[],
  width: number,
  height: number,
): { cells: Cell[]; moves: GravityMove[] } {
  const next = cells.map(cloneCell)
  const moves: GravityMove[] = []

  for (let x = 0; x < width; x++) {
    let writeY = height - 1
    for (let y = height - 1; y >= 0; y--) {
      const i = x + y * width
      const cell = next[i]!

      if (barrier(cell)) {
        writeY = y - 1
        continue
      }

      if (occupies(cell)) {
        const dest = x + writeY * width
        if (dest !== i) {
          const moving = cloneCell(cell)
          const destJelly = next[dest]!.jelly
          const srcJelly = next[i]!.jelly
          next[dest] = { ...moving, jelly: destJelly }
          next[i] = {
            color: null,
            special: 'none',
            frosting: 0,
            marmalade: false,
            lock: false,
            swirl: false,
            chocolate: false,
            bomb: 0,
            jelly: srcJelly,
            ingredient: false,
          }
          moves.push({ from: i, to: dest })
        }
        writeY -= 1
      }
    }
  }

  return { cells: next, moves }
}

export function gravityLeavesNoUnsupportedFloat(
  cells: Cell[],
  width: number,
  height: number,
): boolean {
  for (let x = 0; x < width; x++) {
    let holeBelow = false
    for (let y = height - 1; y >= 0; y--) {
      const cell = cells[x + y * width]!
      if (cell.frosting > 0 || cell.chocolate || cell.lock) {
        holeBelow = false
        continue
      }
      if (isHole(cell)) {
        holeBelow = true
        continue
      }
      if (occupies(cell) && holeBelow) return false
    }
  }
  return true
}

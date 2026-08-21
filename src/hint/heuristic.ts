import { reduce } from '../engine/reducer'
import { objectiveComplete } from '../engine/objectives'
import {
  adjacent,
  isSwappable,
  BOARD_WIDTH,
  type GameState,
} from '../engine/types'

export interface HintMove {
  a: number
  b: number
  score: number
  summary: string
}

function jellyLeft(state: GameState): number {
  if (state.objective.type === 'jelly') return state.objective.remaining
  return state.cells.reduce((n, c) => n + c.jelly, 0)
}

function ingredientsLeft(state: GameState): number {
  if (state.objective.type === 'ingredient') return state.objective.remaining
  return state.cells.filter((c) => c.ingredient).length
}

function heuristicScore(before: GameState, after: GameState): number {
  let score = after.score - before.score
  score += after.combo * 40
  score += (jellyLeft(before) - jellyLeft(after)) * 80
  score += (ingredientsLeft(before) - ingredientsLeft(after)) * 120
  if (objectiveComplete(after.objective)) score += 5000
  if (after.status === 'lost') score -= 8000
  return score
}

export function findBestMove(state: GameState): HintMove | null {
  let best: HintMove | null = null
  for (let i = 0; i < state.cells.length; i++) {
    if (!isSwappable(state.cells[i]!)) continue
    for (const j of [i + 1, i + BOARD_WIDTH]) {
      if (j >= state.cells.length) continue
      if (!adjacent(i, j, BOARD_WIDTH)) continue
      if (!isSwappable(state.cells[j]!)) continue
      const next = reduce(state, { type: 'swap', a: i, b: j })
      if (next.events.some((e) => e.type === 'invalid-swap')) continue
      const score = heuristicScore(state, next)
      if (!best || score > best.score) {
        const ca = state.cells[i]!
        const cb = state.cells[j]!
        best = {
          a: i,
          b: j,
          score,
          summary: `Swap ${ca.color ?? ca.special} ↔ ${cb.color ?? cb.special}; combo ${next.combo}; jelly ${jellyLeft(next)}; score Δ ${next.score - state.score}`,
        }
      }
    }
  }
  return best
}

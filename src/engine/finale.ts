import { rngInt } from './prng'
import { occupies, type GameState } from './types'

/** Cap the starburst so leftover moves do not wipe the board in one clip. */
export const FINALE_SUN_CAP = 6

export function convertMovesToSpecials(state: GameState): GameState {
  let rng = state.rngState
  const cells = state.cells.map((c) => ({ ...c }))
  const converted: number[] = []
  let remaining = Math.min(state.movesLeft, FINALE_SUN_CAP)

  const candidates: number[] = []
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i]!
    if (occupies(c) && c.special === 'none' && c.color && !c.lock && !c.marmalade && !c.swirl) {
      candidates.push(i)
    }
  }

  while (remaining > 0 && candidates.length > 0) {
    const pick = rngInt(rng, candidates.length)
    rng = pick.state
    const index = candidates.splice(pick.n, 1)[0]!
    cells[index] = { ...cells[index]!, special: 'wrapped' }
    converted.push(index)
    remaining -= 1
  }

  return {
    ...state,
    cells,
    rngState: rng,
    movesLeft: 0,
    status: 'finale',
    events: [
      ...state.events,
      { type: 'finale-convert', indices: converted, kind: 'wrapped' },
    ],
  }
}

export function finaleMultiplier(wave: number): number {
  return 1 + wave * 0.35
}

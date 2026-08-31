import { describe, expect, it } from 'vitest'
import { findMatches } from '~/engine/match'
import { createGame } from '~/engine/reducer'
import { applyTutorialBoard, TUTORIAL_LEVEL, TUTORIAL_PAIR } from './tutorial'

describe('Flight School board', () => {
  it('starts without completed matches and the coached swap creates a real match', () => {
    const state = applyTutorialBoard(createGame(TUTORIAL_LEVEL))
    expect(findMatches(state.cells)).toEqual([])

    const cells = state.cells.map((cell) => ({ ...cell }))
    ;[cells[TUTORIAL_PAIR.a], cells[TUTORIAL_PAIR.b]] = [cells[TUTORIAL_PAIR.b]!, cells[TUTORIAL_PAIR.a]!]
    const matches = findMatches(cells, undefined, undefined, [TUTORIAL_PAIR.a, TUTORIAL_PAIR.b])
    expect(matches.some((match) => match.indices.includes(TUTORIAL_PAIR.a))).toBe(true)
  })
})

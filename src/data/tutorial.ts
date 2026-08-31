import {
  BOARD_SIZE,
  BOARD_WIDTH,
  idx,
  starCell,
  type Cell,
  type GameState,
  type LevelConfig,
  type StarColor,
} from '~/engine/types'

export const TUTORIAL_PAIR = { a: idx(3, 7), b: idx(3, 6) }
export const TUTORIAL_SUN = idx(BOARD_WIDTH - 1, 8)

export type LessonId =
  | 'welcome'
  | 'swap'
  | 'goal'
  | 'comet'
  | 'power'
  | 'tray'
  | 'challenges'
  | 'clear'

export type LessonStep = {
  id: LessonId
  title: string
  body: string
  wait: 'next' | 'swap' | 'ignite' | 'booster' | 'win'
  spotlight?: number[]
  pair?: { a: number; b: number }
  focus?: 'goal' | 'comet' | 'challenges' | 'tray' | 'board'
}

export const LESSONS: LessonStep[] = [
  {
    id: 'welcome',
    title: 'Welcome aboard, Pilot',
    body: 'Flight School walks each control once, then you enter Amber Veil 1-1. Tap Next after you read a beat — or hit Skip tutorial anytime.',
    wait: 'next',
    focus: 'board',
  },
  {
    id: 'swap',
    title: 'Slide two neighbors',
    body: 'Drag the glowing blue star onto the gold beside it. Three in a row — or a full 2×2 square — burst. That’s the voyage in one swipe.',
    wait: 'swap',
    pair: TUTORIAL_PAIR,
    spotlight: [TUTORIAL_PAIR.a, TUTORIAL_PAIR.b],
    focus: 'board',
  },
  {
    id: 'goal',
    title: 'Orbit goal',
    body: 'The glowing Orbit challenge card is the only way to pass. Burst stars on the bright cyan tiles to clear nebula jelly. Score is flavor — the challenge is the gate.',
    wait: 'next',
    focus: 'goal',
  },
  {
    id: 'comet',
    title: 'Comet Tail',
    body: 'Chain bursts before the tail fades and it grows. Let it die and the streak resets. Keep the wake hot.',
    wait: 'next',
    focus: 'comet',
  },
  {
    id: 'power',
    title: 'Solar flare',
    body: 'Bottom-right is a power play — a blazing sun, not a regular star. Swap it into a 3-match to flare, or tap it twice to ignite a 3×3 burst.',
    wait: 'ignite',
    spotlight: [TUTORIAL_SUN],
    focus: 'board',
  },
  {
    id: 'tray',
    title: 'Solar kit',
    body: 'The tray under the board is your kit. Arm the Meteor, then tap a star. Later, rare logos pop on the sky and stash themselves — tap one to grab it sooner. The shop sells more as you open sectors.',
    wait: 'booster',
    focus: 'tray',
  },
  {
    id: 'challenges',
    title: 'Bonus challenges',
    body: 'Outlined challenges are extra credit. Finish the orbit goal to win even if you skip them. Seal them for more stardust.',
    wait: 'next',
    focus: 'challenges',
  },
  {
    id: 'clear',
    title: 'Finish the orbit',
    body: 'You’re free now. Clear the rest of the nebula jelly to graduate Flight School and jump into Amber Veil 1-1.',
    wait: 'win',
    focus: 'goal',
  },
]

// Keep training readable: cyan belongs to the objective wells, not a surprise
// sixth playable star that looks like a special piece.
const COLORS: StarColor[] = ['gold', 'red', 'green', 'blue', 'purple']

function paint(color: StarColor, extra?: Partial<Cell>): Cell {
  return { ...starCell(color), ...extra }
}

export const TUTORIAL_LEVEL: LevelConfig = {
  id: 0,
  seed: 7,
  name: 'Flight School',
  sectorId: 1,
  systemId: 'tutorial',
  nebulaId: 'tutorial',
  stageId: 'tutorial',
  moves: 42,
  colorCount: 5,
  rewardCap: 40,
  objective: { type: 'jelly', remaining: 8 },
  frosting: [],
  marmalade: [],
  locks: [],
  swirls: [],
  chocolate: [],
  bombs: [],
  jelly: Array.from({ length: BOARD_SIZE }, (_, i) =>
    [idx(1, 2), idx(5, 2), idx(8, 3), idx(2, 5), idx(6, 5), idx(1, 8), idx(5, 8), idx(8, 7)].includes(i)
      ? 1
      : 0,
  ),
  ingredients: [],
  exits: Array.from({ length: BOARD_WIDTH }, (_, i) => i),
  timeLimit: 180,
}

export function applyTutorialBoard(state: GameState): GameState {
  const cells = state.cells.map((cell, i) => {
    const x = i % BOARD_WIDTH
    const y = Math.floor(i / BOARD_WIDTH)
    const color = COLORS[(x + y * 3) % 5]!
    return {
      ...paint(color),
      jelly: cell.jelly,
    }
  })
  cells[idx(1, 7)] = { ...paint('gold'), jelly: cells[idx(1, 7)]!.jelly }
  cells[idx(2, 7)] = { ...paint('gold'), jelly: cells[idx(2, 7)]!.jelly }
  // Keep the coached pair quiet until the player swaps. With compact L-shaped
  // Match 3 enabled, this lower corner must not also be gold.
  cells[idx(1, 8)] = { ...paint('purple'), jelly: cells[idx(1, 8)]!.jelly }
  cells[idx(3, 7)] = { ...paint('blue'), jelly: cells[idx(3, 7)]!.jelly }
  cells[idx(3, 6)] = { ...paint('gold'), jelly: cells[idx(3, 6)]!.jelly }
  cells[idx(2, 6)] = { ...paint('red'), jelly: cells[idx(2, 6)]!.jelly }
  cells[idx(4, 6)] = { ...paint('blue'), jelly: cells[idx(4, 6)]!.jelly }
  cells[TUTORIAL_SUN] = { ...paint('gold'), special: 'wrapped', jelly: cells[TUTORIAL_SUN]!.jelly }
  return {
    ...state,
    cells,
    objective: { type: 'jelly', remaining: cells.reduce((n, c) => n + c.jelly, 0) },
  }
}

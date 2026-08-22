import { starCell, type Cell, type GameState, type LevelConfig, type StarColor } from '~/engine/types'

export const TUTORIAL_PAIR = { a: 51, b: 43 }
export const TUTORIAL_SUN = 63

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
    body: 'This is Flight School. I’ll pause on each beat — you fly the move. Tap Next when you’re ready.',
    wait: 'next',
    focus: 'board',
  },
  {
    id: 'swap',
    title: 'Slide two neighbors',
    body: 'Drag the glowing blue star onto the gold beside it. Three of a kind burst. That’s the whole voyage in one swipe.',
    wait: 'swap',
    pair: TUTORIAL_PAIR,
    spotlight: [TUTORIAL_PAIR.a, TUTORIAL_PAIR.b],
    focus: 'board',
  },
  {
    id: 'goal',
    title: 'Orbit goal',
    body: 'The gold card is how the stage ends. Clear every nebula jelly (or whatever it asks). Score is flavor — the goal is the gate.',
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
    body: 'Bottom-right is a power play — a blazing sun, not a regular star. Swap it, or tap it twice to ignite the flares.',
    wait: 'ignite',
    spotlight: [TUTORIAL_SUN],
    focus: 'board',
  },
  {
    id: 'tray',
    title: 'Solar kit',
    body: 'The tray under the board is your kit. Arm the Meteor, then tap a star. Later, rare logos pop on the sky — tap them to stash a charge. The shop sells more as you open sectors.',
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

const COLORS: StarColor[] = ['gold', 'red', 'green', 'blue', 'purple', 'cyan']

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
  jelly: Array.from({ length: 64 }, (_, i) => ([43, 49, 50, 51, 58, 59, 60, 61].includes(i) ? 1 : 0)),
  ingredients: [],
  exits: Array.from({ length: 8 }, () => true),
  timeLimit: 180,
}

export function applyTutorialBoard(state: GameState): GameState {
  const cells = state.cells.map((cell, i) => {
    const x = i % 8
    const y = Math.floor(i / 8)
    const color = COLORS[(x + y * 3) % 5]!
    return {
      ...paint(color),
      jelly: cell.jelly,
    }
  })
  cells[49] = { ...paint('gold'), jelly: cells[49]!.jelly }
  cells[50] = { ...paint('gold'), jelly: cells[50]!.jelly }
  cells[51] = { ...paint('blue'), jelly: cells[51]!.jelly }
  cells[43] = { ...paint('gold'), jelly: cells[43]!.jelly }
  cells[42] = { ...paint('red'), jelly: cells[42]!.jelly }
  cells[44] = { ...paint('cyan'), jelly: cells[44]!.jelly }
  cells[63] = { ...paint('gold'), special: 'wrapped', jelly: cells[63]!.jelly }
  return {
    ...state,
    cells,
    objective: { type: 'jelly', remaining: cells.reduce((n, c) => n + c.jelly, 0) },
  }
}

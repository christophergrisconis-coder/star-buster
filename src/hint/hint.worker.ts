import { findBestMove } from './heuristic'
import type { GameState } from '../engine/types'

self.onmessage = (event: MessageEvent<{ state: GameState }>) => {
  const move = findBestMove(event.data.state, 1)
  self.postMessage({ move })
}

export {}

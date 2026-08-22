import { findBestMove } from './heuristic'
import type { GameState } from '../engine/types'

self.onmessage = (event: MessageEvent<{ state: GameState }>) => {
  const move = findBestMove(event.data.state)
  self.postMessage({ move })
}

export {}

import { findBestMove } from './heuristic'
import type { GameState } from '../engine/types'

self.onmessage = (e: MessageEvent<{ state: GameState }>) => {
  const move = findBestMove(e.data.state)
  self.postMessage({ move })
}

export {}

import { useEffect, useRef } from 'react'
import type { GameState } from '~/engine/types'
import type { HintMove } from './heuristic'

export function useHintWorker() {
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('./hint.worker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    return () => worker.terminate()
  }, [])

  const requestHint = (state: GameState) =>
    new Promise<HintMove | null>((resolve) => {
      const worker = workerRef.current
      if (!worker) {
        resolve(null)
        return
      }
      const onMessage = (event: MessageEvent<{ move: HintMove | null }>) => {
        worker.removeEventListener('message', onMessage)
        resolve(event.data.move)
      }
      worker.addEventListener('message', onMessage)
      worker.postMessage({ state })
    })

  return { requestHint }
}

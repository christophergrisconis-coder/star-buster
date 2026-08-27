import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameState } from '~/engine/types'
import type { HintMove } from './heuristic'

export function useHintCoach() {
  const workerRef = useRef<Worker | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<HintMove | null>(null)
  const [coachLine, setCoachLine] = useState<string | null>(null)
  const [coachError, setCoachError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current
    workerRef.current = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    return workerRef.current
  }

  const requestHint = useCallback(async (state: GameState) => {
    setBusy(true)
    setCoachError(null)
    const worker = ensureWorker()
    const move = await new Promise<HintMove | null>((resolve) => {
      const onMsg = (e: MessageEvent<{ move: HintMove | null }>) => {
        worker.removeEventListener('message', onMsg)
        resolve(e.data.move)
      }
      worker.addEventListener('message', onMsg)
      worker.postMessage({ state })
    })
    setHint(move)
    if (move) {
      try {
        const { coachHint } = await import('~/server/hint')
        const line = await coachHint({ data: { summary: move.summary } })
        setCoachLine(line)
      } catch (err) {
        setCoachError(err instanceof Error ? err.message : 'Coach is offline.')
        setCoachLine(null)
      }
    } else {
      setCoachLine('No legal improving swap from this orbit.')
    }
    setBusy(false)
    return move
  }, [])

  return { busy, hint, coachLine, coachError, requestHint }
}

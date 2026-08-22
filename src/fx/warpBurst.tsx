import { useEffect } from 'react'
import { useSyncExternalStore } from 'react'

type WarpJob = { id: number; onDone: () => void }

let job: WarpJob | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function requestWarpThen(onDone: () => void) {
  job = { id: Date.now(), onDone }
  emit()
}

export function useWarpJob() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => job,
    () => null,
  )
}

export function WarpOverlay() {
  const current = useWarpJob()

  useEffect(() => {
    if (!current) return
    const t = window.setTimeout(() => {
      const done = current.onDone
      if (job?.id === current.id) {
        job = null
        emit()
        done()
      }
    }, 680)
    return () => window.clearTimeout(t)
  }, [current])

  if (!current) return null
  return (
    <div className="warp-burst" aria-hidden>
      <span className="warp-ring" />
      <span className="warp-ring warp-ring-delay" />
      <span className="warp-core" />
      <span className="shooting-star" />
      <span className="shooting-star shooting-star-b" />
      <span className="shooting-star shooting-star-c" />
    </div>
  )
}

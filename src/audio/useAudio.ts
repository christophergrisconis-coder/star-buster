import { useEffect, useSyncExternalStore } from 'react'
import { synth } from './synth'

let muted = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function useAudio() {
  const isMuted = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => muted,
    () => muted,
  )

  useEffect(() => {
    const unlock = () => {
      void synth.resume()
      synth.startBgm()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const toggle = () => {
    muted = !muted
    synth.setMuted(muted)
    if (!muted) {
      void synth.resume()
      synth.startBgm()
    } else {
      synth.stopBgm()
    }
    emit()
  }

  return {
    muted: isMuted,
    pop: (combo: number) => synth.pop(combo),
    whoosh: () => synth.whoosh(),
    fanfare: () => synth.fanfare(),
    toggle,
    toggleMute: toggle,
  }
}

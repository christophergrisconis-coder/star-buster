import { useEffect, useSyncExternalStore } from 'react'
import { getMuted, persistMuted, subscribeMuted } from './muteStore'
import { synth } from './synth'

export function useAudio() {
  const isMuted = useSyncExternalStore(subscribeMuted, getMuted, () => false)

  useEffect(() => {
    synth.setMuted(getMuted())
    const unlock = () => {
      void synth.resume()
      if (!getMuted()) synth.startBgm()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    synth.setMuted(isMuted)
    if (isMuted) synth.stopBgm()
  }, [isMuted])

  const toggle = () => {
    const next = !getMuted()
    persistMuted(next)
    synth.setMuted(next)
    if (!next) {
      void synth.resume()
      synth.startBgm()
    } else {
      synth.stopBgm()
    }
  }

  return {
    muted: isMuted,
    pop: (combo: number) => synth.pop(combo),
    whoosh: () => synth.whoosh(),
    fanfare: () => synth.fanfare(),
    stripedClear: () => synth.stripedClear(),
    colorBombBlast: () => synth.colorBombBlast(),
    gachaReveal: (rarity: 'common' | 'rare' | 'epic' | 'legendary') => synth.gachaReveal(rarity),
    toggle,
    toggleMute: toggle,
  }
}

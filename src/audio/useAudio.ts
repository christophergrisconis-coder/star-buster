import { useEffect, useSyncExternalStore } from 'react'
import {
  getMuted,
  getMusicVolume,
  getSfxVolume,
  persistMuted,
  persistMusicVolume,
  persistSfxVolume,
  subscribeMuted,
} from './muteStore'
import { synth } from './synth'

export function useAudio() {
  const isMuted = useSyncExternalStore(subscribeMuted, getMuted, () => false)
  const sfxVolume = useSyncExternalStore(subscribeMuted, getSfxVolume, () => 1)
  const musicVolume = useSyncExternalStore(subscribeMuted, getMusicVolume, () => 1)

  useEffect(() => {
    synth.setMuted(getMuted())
    synth.setSfxVolume(getSfxVolume())
    synth.setMusicVolume(getMusicVolume())
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

  useEffect(() => {
    synth.setSfxVolume(sfxVolume)
  }, [sfxVolume])

  useEffect(() => {
    synth.setMusicVolume(musicVolume)
  }, [musicVolume])

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

  const setSfxVolume = (v: number) => {
    persistSfxVolume(v)
    synth.setSfxVolume(v)
    synth.tick()
  }

  const setMusicVolume = (v: number) => {
    persistMusicVolume(v)
    synth.setMusicVolume(v)
  }

  return {
    muted: isMuted,
    sfxVolume,
    musicVolume,
    setSfxVolume,
    setMusicVolume,
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

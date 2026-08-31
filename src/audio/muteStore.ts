const MUTE_KEY = 'sb-muted'
const SFX_KEY = 'sb-vol-sfx'
const MUSIC_KEY = 'sb-vol-music'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function readVolume(key: string): number {
  if (typeof window === 'undefined') return 1
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return 1
    const v = Number(raw)
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1
  } catch {
    return 1
  }
}

let muted = readMuted()
let sfxVolume = readVolume(SFX_KEY)
let musicVolume = readVolume(MUSIC_KEY)
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist(key: string, value: string) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* quota */
    }
  }
}

export function getMuted() {
  return muted
}

export function persistMuted(next: boolean) {
  muted = next
  persist(MUTE_KEY, next ? '1' : '0')
  emit()
}

export function getSfxVolume() {
  return sfxVolume
}

export function persistSfxVolume(v: number) {
  sfxVolume = Math.min(1, Math.max(0, v))
  persist(SFX_KEY, String(sfxVolume))
  emit()
}

export function getMusicVolume() {
  return musicVolume
}

export function persistMusicVolume(v: number) {
  musicVolume = Math.min(1, Math.max(0, v))
  persist(MUSIC_KEY, String(musicVolume))
  emit()
}

export function subscribeMuted(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

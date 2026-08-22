const MUTE_KEY = 'sb-muted'

function readMuted(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

let muted = readMuted()
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function getMuted() {
  return muted
}

export function persistMuted(next: boolean) {
  muted = next
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MUTE_KEY, next ? '1' : '0')
    } catch {
      /* quota */
    }
  }
  emit()
}

export function subscribeMuted(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

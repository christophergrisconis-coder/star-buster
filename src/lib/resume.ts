import type { GameState } from '~/engine/types'

const KEY = 'star-buster-resume'

interface ResumeBlob {
  levelId: number
  savedAt: number
  state: GameState
}

/** Persist a mid-run campaign board so a closed tab can pick up where it left off. */
export function saveRun(levelId: number, state: GameState): void {
  if (typeof window === 'undefined') return
  try {
    const blob: ResumeBlob = {
      levelId,
      savedAt: Date.now(),
      // Strip transient events so restoring never replays animations/sounds.
      state: { ...state, events: [] },
    }
    localStorage.setItem(KEY, JSON.stringify(blob))
  } catch {
    /* storage unavailable or full */
  }
}

export function loadRun(levelId: number): GameState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const blob = JSON.parse(raw) as ResumeBlob
    if (blob.levelId !== levelId) return null
    const s = blob.state
    if (!s || s.status !== 'playing') return null
    if (!Array.isArray(s.cells) || s.cells.length !== s.width * s.height) return null
    return { ...s, events: [] }
  } catch {
    return null
  }
}

export function clearRun(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

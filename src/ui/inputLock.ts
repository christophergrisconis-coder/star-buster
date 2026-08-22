/** Forced unlock if cascade FX hang (rAF pause, cancelled mid-await, etc.). */
export const INPUT_LOCK_SAFETY_MS = 8000

/** Mobile-friendly slide distance; ~1/6 of an 8-wide 360px cell. */
export const SLIDE_THRESHOLD_PX = 8

export function shouldClearInputLock(
  busyStartedAt: number | null,
  now: number,
  safetyMs = INPUT_LOCK_SAFETY_MS,
): boolean {
  if (busyStartedAt == null) return false
  return now - busyStartedAt >= safetyMs
}

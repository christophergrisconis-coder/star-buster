const KEY = 'star-buster-flight-school'

export function hasCompletedTutorial(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(KEY) === 'done'
  } catch {
    return false
  }
}

export function markTutorialComplete() {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, 'done')
}

export function resetTutorial() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}

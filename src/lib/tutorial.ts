const KEY = 'star-buster-flight-school'

function schoolKey() {
  if (typeof window === 'undefined') return KEY
  try {
    const raw = localStorage.getItem('star-buster-owner')
    if (raw && JSON.parse(raw).role === 'co-admin') return `${KEY}:ana`
  } catch {
    /* ignore */
  }
  return KEY
}

export function hasCompletedTutorial(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return localStorage.getItem(schoolKey()) === 'done'
  } catch {
    return false
  }
}

export function markTutorialComplete() {
  if (typeof window === 'undefined') return
  localStorage.setItem(schoolKey(), 'done')
}

export function resetTutorial() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(schoolKey())
}

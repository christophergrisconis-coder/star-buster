import { accountStorageKey } from './progress'

const KEY = 'star-buster-flight-school'

function schoolKey() {
  return accountStorageKey(KEY)
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

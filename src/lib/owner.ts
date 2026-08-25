import { setAdminPilot, unlockAdminVoyage } from './progress'

export const OWNER_EMAIL = 'admnowner@advancedcreationstudio.com'

const OWNER_SESSION = 'star-buster-owner'

export function isOwnerEmail(email: string) {
  return email.trim().toLowerCase() === OWNER_EMAIL
}

export function ownerPasswordMatches(password: string) {
  const expected = import.meta.env.VITE_OWNER_PASSWORD
  if (!expected) return false
  return password === expected
}

export function getOwnerSession(): { email: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(OWNER_SESSION)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { email?: string }
    if (!parsed.email || !isOwnerEmail(parsed.email)) return null
    return { email: OWNER_EMAIL }
  } catch {
    return null
  }
}

export function activateOwnerAccount(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(OWNER_SESSION, JSON.stringify({ email: OWNER_EMAIL }))
  setAdminPilot(true)
  unlockAdminVoyage()
}

export function signInOwner(email: string, password: string): { error?: string } {
  if (!isOwnerEmail(email) || !ownerPasswordMatches(password)) {
    return { error: 'Wrong owner credentials' }
  }
  activateOwnerAccount()
  return {}
}

export function hydrateOwnerAccess() {
  if (getOwnerSession()) activateOwnerAccount()
}

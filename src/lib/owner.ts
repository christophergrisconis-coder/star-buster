import { setAdminPilot, unlockAdminVoyage, setEquippedTitle } from './progress'

export const OWNER_EMAIL = 'admnowner@advancedcreationstudio.com'
export const CO_ADMIN_EMAIL = 'ana.rankin96@gmail.com'

export interface AdminAccount {
  email: string
  role: 'admin' | 'co-admin'
  displayName: string
  passwords: string[]
}

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    email: 'admnowner@advancedcreationstudio.com',
    role: 'admin',
    displayName: 'Chris (Admin)',
    passwords: ['axg213!', 'orbit-admin', 'admin'],
  },
  {
    email: 'chris@advancedcreationstudio.com',
    role: 'admin',
    displayName: 'Chris (Admin)',
    passwords: ['axg213!', 'orbit-admin'],
  },
  {
    email: 'ana.rankin96@gmail.com',
    role: 'co-admin',
    displayName: 'Anaclara X Grisconis',
    passwords: ['cwg021326!', 'cwg021325!', 'axg213!'],
  },
]

const OWNER_SESSION = 'star-buster-owner'

export function isOwnerEmail(email: string): boolean {
  const norm = email.trim().toLowerCase()
  return ADMIN_ACCOUNTS.some((a) => a.email.toLowerCase() === norm)
}

export function findAdminAccount(email: string): AdminAccount | undefined {
  const norm = email.trim().toLowerCase()
  return ADMIN_ACCOUNTS.find((a) => a.email.toLowerCase() === norm)
}

export function ownerPasswordMatches(email: string, password: string): boolean {
  const acc = findAdminAccount(email)
  if (!acc) return false
  const envPass = import.meta.env.VITE_OWNER_PASSWORD
  if (envPass && password === envPass) return true
  return acc.passwords.includes(password.trim())
}

export interface OwnerSession {
  email: string
  role: 'admin' | 'co-admin'
  displayName: string
}

export function getOwnerSession(): OwnerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(OWNER_SESSION)
    if (!raw) return null
    const parsed = JSON.parse(raw) as OwnerSession
    if (!parsed.email || !isOwnerEmail(parsed.email)) return null
    return parsed
  } catch {
    return null
  }
}

export function activateOwnerAccount(account?: AdminAccount): void {
  if (typeof window === 'undefined') return
  const acc = account ?? ADMIN_ACCOUNTS[0]!
  const session: OwnerSession = {
    email: acc.email,
    role: acc.role,
    displayName: acc.displayName,
  }
  localStorage.setItem(OWNER_SESSION, JSON.stringify(session))
  setAdminPilot(true)
  unlockAdminVoyage()
  if (acc.role === 'co-admin') {
    setEquippedTitle('✦ True Love & Co-Admin ✦')
  } else {
    setEquippedTitle('✦ Master Orbit Admin ✦')
  }
}

export function signInOwner(email: string, password: string): { error?: string; account?: AdminAccount } {
  const acc = findAdminAccount(email)
  if (!acc || !ownerPasswordMatches(email, password)) {
    return { error: 'Invalid pilot credentials' }
  }
  activateOwnerAccount(acc)
  return { account: acc }
}

export function hydrateOwnerAccess() {
  const sess = getOwnerSession()
  if (sess) {
    const acc = findAdminAccount(sess.email)
    if (acc) activateOwnerAccount(acc)
  }
}

export function signOutOwner() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(OWNER_SESSION)
  setAdminPilot(false)
}

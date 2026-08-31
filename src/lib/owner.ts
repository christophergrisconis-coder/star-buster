import { setAdminPilot, unlockAdminVoyage, setEquippedTitle } from './progress'
import { useState, useEffect } from 'react'

export const OWNER_EMAIL = 'admnowner@advancedcreationstudio.com'
export const CO_ADMIN_EMAIL = 'ana.rankin96@gmail.com'

export interface AdminAccount {
  email: string
  aliases: string[]
  role: 'admin' | 'co-admin'
  displayName: string
  avatarUrl?: string
}

/**
 * Family pilot identities. Authentication happens ONLY against the
 * build-time passcodes below (never committed to the repo):
 *   VITE_OWNER_PASSWORD    — Chris / admin
 *   VITE_CO_ADMIN_PASSWORD — Anaclara / co-admin (falls back to owner passcode)
 * If neither is set, owner login is disabled entirely.
 */
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    email: OWNER_EMAIL,
    aliases: ['chris@advancedcreationstudio.com', 'chrisgrisconis@icloud.com'],
    role: 'admin',
    displayName: 'Chris (Admin)',
    avatarUrl: '/luma-star-128.png',
  },
  {
    email: CO_ADMIN_EMAIL,
    aliases: ['tartars_96_gauged@icloud.com'],
    role: 'co-admin',
    displayName: 'Anaclara X Grisconis',
    avatarUrl: '/luma-heart-128.png',
  },
]

const OWNER_SESSION = 'star-buster-owner'
const FAMILY_DEVICE = 'star-buster-family-device'

function ownerPasscode(): string | undefined {
  const v = import.meta?.env?.VITE_OWNER_PASSWORD
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function coAdminPasscode(): string | undefined {
  const v = import.meta?.env?.VITE_CO_ADMIN_PASSWORD
  if (typeof v === 'string' && v.length > 0) return v
  return ownerPasscode()
}

export function isOwnerEmail(email: string): boolean {
  return Boolean(findAdminAccount(email))
}

export function findAdminAccount(email: string): AdminAccount | undefined {
  const norm = email.trim().toLowerCase()
  return ADMIN_ACCOUNTS.find(
    (a) => a.email.toLowerCase() === norm || a.aliases.some((alias) => alias.toLowerCase() === norm),
  )
}

export function ownerPasswordMatches(email: string, password: string): boolean {
  const acc = findAdminAccount(email)
  if (!acc) return false
  const p = password.trim()
  if (!p) return false
  const pass = acc.role === 'admin' ? ownerPasscode() : coAdminPasscode()
  const owner = ownerPasscode()
  return Boolean((pass && p === pass) || (acc.role === 'co-admin' && owner && p === owner))
}

/**
 * A device becomes a "family device" after one successful passcode or
 * password login. Only then do the one-tap dock buttons appear/work.
 */
export function isFamilyDevice(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(FAMILY_DEVICE) === '1'
  } catch {
    return false
  }
}

function markFamilyDevice(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FAMILY_DEVICE, '1')
  } catch {
    /* storage unavailable */
  }
}

export interface OwnerSession {
  email: string
  role: 'admin' | 'co-admin'
  displayName: string
  avatarUrl?: string
}

/**
 * The owner cookie is written by the browser and is forgeable by anyone —
 * treat it as a display hint only. It must NEVER authorize server-side
 * reads or writes; real authorization goes through Supabase auth.
 */
export function parseOwnerCookie(cookieHeader: string | null | undefined): OwnerSession | null {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${OWNER_SESSION}=`))
  if (!match) return null
  try {
    const raw = decodeURIComponent(match.slice(`${OWNER_SESSION}=`.length))
    const parsed = JSON.parse(raw) as OwnerSession
    if (!parsed.email || !isOwnerEmail(parsed.email)) return null
    return parsed
  } catch {
    return null
  }
}

export function getOwnerSession(): OwnerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(OWNER_SESSION)
    if (raw) {
      const parsed = JSON.parse(raw) as OwnerSession
      if (parsed.email && isOwnerEmail(parsed.email)) return parsed
    }
    return parseOwnerCookie(document.cookie)
  } catch {
    return parseOwnerCookie(typeof document === 'undefined' ? '' : document.cookie)
  }
}

export function isCoAdminPilot(): boolean {
  return getOwnerSession()?.role === 'co-admin'
}

export function useIsCoAdmin(): boolean {
  const [isCoAdmin, setIsCoAdmin] = useState(false)
  useEffect(() => {
    setIsCoAdmin(isCoAdminPilot())
    const onChange = () => setIsCoAdmin(isCoAdminPilot())
    window.addEventListener('owner-session-changed', onChange)
    return () => window.removeEventListener('owner-session-changed', onChange)
  }, [])
  return isCoAdmin
}

export function persistOwnerSession(acc: AdminAccount): void {
  if (typeof window === 'undefined') return
  const session: OwnerSession = {
    email: acc.email,
    role: acc.role,
    displayName: acc.displayName,
    avatarUrl: acc.avatarUrl,
  }
  localStorage.setItem(OWNER_SESSION, JSON.stringify(session))
  document.cookie = `${OWNER_SESSION}=${encodeURIComponent(JSON.stringify(session))}; Path=/; Max-Age=31536000; SameSite=Lax`
  window.dispatchEvent(new Event('owner-session-changed'))
}

export function activateOwnerAccount(account?: AdminAccount): void {
  if (typeof window === 'undefined') return
  const acc = account ?? ADMIN_ACCOUNTS[0]!
  persistOwnerSession(acc)
  markFamilyDevice()
  if (acc.role === 'co-admin') {
    setAdminPilot(false)
    setEquippedTitle('✦ True Love & Co-Admin ✦')
  } else {
    setAdminPilot(true)
    unlockAdminVoyage()
    setEquippedTitle('✦ Master Orbit Admin ✦')
  }
}

export function signInOwner(email: string, password: string): { error?: string; account?: AdminAccount } {
  const acc = findAdminAccount(email)
  if (!acc || !ownerPasswordMatches(email, password)) {
    return { error: 'Invalid email or password' }
  }
  activateOwnerAccount(acc)
  return { account: acc }
}

/** One-tap dock — only honored on devices that already passcode-authenticated once. */
export function dockOwnerAccount(email: string): { error?: string; account?: AdminAccount } {
  if (!isFamilyDevice()) {
    return { error: 'This device is not docked yet — sign in with your passcode first.' }
  }
  const acc = findAdminAccount(email)
  if (!acc) return { error: 'Unknown owner account' }
  activateOwnerAccount(acc)
  return { account: acc }
}

export function loginWithPasscode(code: string): { error?: string; account?: AdminAccount } {
  const c = code.trim()
  if (!c) return { error: 'Enter a docking code' }
  const co = coAdminPasscode()
  const owner = ownerPasscode()
  if (co && c === co && co !== owner) {
    const ana = findAdminAccount(CO_ADMIN_EMAIL)!
    activateOwnerAccount(ana)
    return { account: ana }
  }
  if (owner && c === owner) {
    const chris = findAdminAccount(OWNER_EMAIL)!
    activateOwnerAccount(chris)
    return { account: chris }
  }
  if (co && c === co) {
    const ana = findAdminAccount(CO_ADMIN_EMAIL)!
    activateOwnerAccount(ana)
    return { account: ana }
  }
  return { error: owner || co ? 'Wrong docking code' : 'Owner docking is not configured on this build' }
}

export function hydrateOwnerAccess() {
  const sess = getOwnerSession()
  if (!sess) return
  const acc = findAdminAccount(sess.email)
  if (!acc) return
  persistOwnerSession(acc)
  if (acc.role === 'admin') {
    setAdminPilot(true)
  } else {
    setAdminPilot(false)
  }
}

export function signOutOwner() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(OWNER_SESSION)
  document.cookie = `${OWNER_SESSION}=; Path=/; Max-Age=0; SameSite=Lax`
  setAdminPilot(false)
  window.dispatchEvent(new Event('owner-session-changed'))
}

const OWNER_SESSION = 'star-buster-owner'

/** Isolate Ana's save from Chris and from regular pilots on the same device. */
export function pilotSlot(): '' | ':ana' {
  if (typeof window === 'undefined') return ''
  try {
    const raw = localStorage.getItem(OWNER_SESSION)
    if (!raw) return ''
    const role = (JSON.parse(raw) as { role?: string }).role
    if (role === 'co-admin') return ':ana'
  } catch {
    /* ignore */
  }
  return ''
}

export function isCoAdminSlot(): boolean {
  return pilotSlot() === ':ana'
}

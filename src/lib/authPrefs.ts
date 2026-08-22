export type AuthProviderId = 'google' | 'apple' | 'azure' | 'email'

const REMEMBER_KEY = 'sb-remember-me'
const PROVIDER_KEY = 'sb-last-provider'

export function getRememberMe(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(REMEMBER_KEY) !== '0'
}

export function setRememberMe(remember: boolean) {
  if (typeof window === 'undefined') return
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function getLastProvider(): AuthProviderId | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PROVIDER_KEY)
  if (raw === 'google' || raw === 'apple' || raw === 'azure' || raw === 'email') return raw
  return null
}

export function setLastProvider(provider: AuthProviderId) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROVIDER_KEY, provider)
}

export function providerLabel(provider: AuthProviderId): string {
  if (provider === 'google') return 'Google'
  if (provider === 'apple') return 'Apple'
  if (provider === 'azure') return 'Microsoft'
  return 'email'
}

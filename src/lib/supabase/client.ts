import { createBrowserClient } from '@supabase/ssr'
import { getRememberMe } from '~/lib/authPrefs'

export function createBrowserSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  const remember = getRememberMe()
  const storage = typeof window === 'undefined' ? undefined : remember ? window.localStorage : window.sessionStorage
  return createBrowserClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: remember,
      storage,
      storageKey: 'sb-star-buster-auth',
    },
  })
}

export function supabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

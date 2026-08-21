import { createBrowserClient } from '@supabase/ssr'

export function createBrowserSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}

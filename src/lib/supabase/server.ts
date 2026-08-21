import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

const url = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anon = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

export function parseSessionCookie(header: string | null | undefined): string | null {
  if (!header) return null
  const cookies = parseCookie(header)
  return (
    cookies['sb-access-token'] ||
    cookies['sb:token'] ||
    Object.entries(cookies).find(([k]) => k.includes('auth-token') && !k.includes('code'))?.[1] ||
    null
  )
}

export function getSupabaseServer(accessToken?: string | null): SupabaseClient | null {
  const u = url()
  const k = anon()
  if (!u || !k) return null
  return createClient(u, k, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createServerSupabase(cookieHeader?: string | null) {
  const u = url()
  const k = anon()
  if (!u || !k) return null
  const cookies = parseCookie(cookieHeader ?? '')
  return createServerClient(u, k, {
    cookies: {
      getAll() {
        return Object.entries(cookies).map(([name, value]) => ({ name, value }))
      },
      setAll() {},
    },
  })
}

function parseCookie(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (!k) continue
    out[k] = decodeURIComponent(rest.join('='))
  }
  return out
}

import { createServerFn } from '@tanstack/react-start'
import { createServerSupabase } from '~/lib/supabase/server'
import { parseOwnerCookie } from '~/lib/owner'

export async function userIdFromRequest(): Promise<string | null> {
  try {
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    const cookie = getRequestHeader('cookie')
    const supabase = createServerSupabase(cookie)
    if (!supabase) return null
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export const getOwnerCookieSession = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { getRequestHeader } = await import('@tanstack/react-start/server')
    return parseOwnerCookie(getRequestHeader('cookie'))
  } catch {
    return null
  }
})

export const getSessionUser = createServerFn({ method: 'GET' }).handler(async () => {
  const id = await userIdFromRequest()
  if (!id) return null
  const { getRequestHeader } = await import('@tanstack/react-start/server')
  const cookie = getRequestHeader('cookie')
  const supabase = createServerSupabase(cookie)
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('id, display_name, avatar_url, skin_id').eq('id', id).maybeSingle()
  return { id, profile: data }
})

import { createServerFn } from '@tanstack/react-start'
import { createServerSupabase } from '~/lib/supabase/server'

export const fetchLeaderboard = createServerFn({ method: 'GET' }).handler(async () => {
  const { getRequestHeader } = await import('@tanstack/react-start/server')
  const supabase = createServerSupabase(getRequestHeader('cookie'))
  if (!supabase) return []
  const { data, error } = await supabase
    .from('leaderboard_public')
    .select('display_name, avatar_url, score')
    .order('score', { ascending: false })
    .limit(25)
  if (error) throw new Error(error.message)
  return data ?? []
})

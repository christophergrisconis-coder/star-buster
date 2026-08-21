import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createServerSupabase } from '~/lib/supabase/server'
import { userIdFromRequest } from './session'

async function authedClient() {
  const userId = await userIdFromRequest()
  if (!userId) throw new Error('Sign in required')
  const { getRequestHeader } = await import('@tanstack/react-start/server')
  const supabase = createServerSupabase(getRequestHeader('cookie'))
  if (!supabase) throw new Error('Supabase is not configured')
  return { supabase, userId }
}

export const saveProgress = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      levelId: z.number().int().positive(),
      bestScore: z.number().int().nonnegative(),
      stars: z.number().int().min(0).max(3),
    }),
  )
  .handler(async ({ data }) => {
    const { supabase, userId } = await authedClient()
    const { error } = await supabase.from('level_progress').upsert({
      user_id: userId,
      level_id: data.levelId,
      best_score: data.bestScore,
      stars: data.stars,
      completed_at: new Date().toISOString(),
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const saveBoard = createServerFn({ method: 'POST' })
  .validator(z.object({ levelId: z.number(), board: z.unknown() }))
  .handler(async ({ data }) => {
    const { supabase, userId } = await authedClient()
    const { error } = await supabase.from('game_saves').upsert({
      user_id: userId,
      board: { levelId: data.levelId, state: data.board },
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const submitScore = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      levelId: z.number().int().positive(),
      score: z.number().int().nonnegative(),
    }),
  )
  .handler(async ({ data }) => {
    const { supabase, userId } = await authedClient()
    const { error } = await supabase.from('leaderboard_entries').insert({
      user_id: userId,
      level_id: data.levelId,
      score: data.score,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

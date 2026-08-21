import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { getSupabaseServer, parseSessionCookie } from '~/lib/supabase/server'

async function cookieHeader(): Promise<string | null> {
  try {
    const mod = await import('@tanstack/react-start/server')
    const getRequestHeader =
      (mod as { getRequestHeader?: (name: string) => string | undefined }).getRequestHeader
    if (getRequestHeader) return getRequestHeader('cookie') ?? null
    const getWebRequest = (mod as { getWebRequest?: () => Request }).getWebRequest
    if (getWebRequest) return getWebRequest().headers.get('cookie')
  } catch {
    /* env without server helpers */
  }
  return null
}

export const sessionMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const token = parseSessionCookie(await cookieHeader())
    if (!token) {
      throw new Error('Unauthorized')
    }
    const supabase = getSupabaseServer(token)
    if (!supabase) throw new Error('Supabase is not configured')
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user) throw new Error('Unauthorized')
    return next({
      context: { userId: data.user.id, token },
    })
  },
)

export const optionalSessionMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const token = parseSessionCookie(await cookieHeader())
    if (!token) return next({ context: { userId: null as string | null, token: null as string | null } })
    const supabase = getSupabaseServer(token)
    if (!supabase) return next({ context: { userId: null as string | null, token: null } })
    const { data } = await supabase.auth.getUser(token)
    return next({ context: { userId: data.user?.id ?? null, token } })
  },
)

const coachHits = new Map<string, number[]>()

export const saveProgressFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .validator((d: { levelId: number; score: number; stars: number; board?: unknown }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getSupabaseServer(context.token)!
    await supabase.from('level_progress').upsert({
      user_id: context.userId,
      level_id: data.levelId,
      best_score: data.score,
      stars: data.stars,
      completed_at: new Date().toISOString(),
    })
    await supabase.from('leaderboard_entries').insert({
      user_id: context.userId,
      level_id: data.levelId,
      score: data.score,
    })
    if (data.board) {
      await supabase.from('game_saves').upsert({
        user_id: context.userId,
        level_id: data.levelId,
        board: data.board,
      })
    }
    return { ok: true }
  })

export const mergeGuestFn = createServerFn({ method: 'POST' })
  .middleware([sessionMiddleware])
  .validator((d: { progress: Array<{ levelId: number; score: number; stars: number }> }) => d)
  .handler(async ({ data, context }) => {
    const supabase = getSupabaseServer(context.token)!
    for (const row of data.progress.filter((p) => p.levelId <= 3)) {
      await supabase.from('level_progress').upsert({
        user_id: context.userId,
        level_id: row.levelId,
        best_score: row.score,
        stars: row.stars,
        completed_at: new Date().toISOString(),
      })
    }
    return { ok: true }
  })

export const coachLineFn = createServerFn({ method: 'POST' })
  .middleware([optionalSessionMiddleware])
  .validator((d: { summary: string; move: string }) => d)
  .handler(async ({ data, context }) => {
    const key = context.userId ?? 'guest'
    const now = Date.now()
    const hits = (coachHits.get(key) ?? []).filter((t) => now - t < 60_000)
    if (hits.length >= 8) {
      return { line: null as string | null, error: 'Coach is catching her breath. Try again in a minute.' }
    }
    hits.push(now)
    coachHits.set(key, hits)

    const apiKey = process.env.AI_API_KEY
    const base = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
    const model = process.env.AI_MODEL || 'gpt-4o-mini'
    if (!apiKey) {
      return { line: null, error: 'AI coach is offline — set AI_API_KEY to enable persona hints.' }
    }
    const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 80,
        messages: [
          {
            role: 'system',
            content:
              'You are Nova, a cool starship navigator coaching a match-3 pilot. Reply with ONE short sentence. No lists.',
          },
          {
            role: 'user',
            content: `Best mechanical move: ${data.move}. Board: ${data.summary}`,
          },
        ],
      }),
    })
    if (!res.ok) {
      return { line: null, error: `AI coach is down (${res.status}).` }
    }
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const line = json.choices?.[0]?.message?.content?.trim() ?? null
    return { line, error: line ? null : 'AI coach returned silence.' }
  })

export const leaderboardFn = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = getSupabaseServer()
  if (!supabase) return { rows: [], error: 'Supabase is not configured.' }
  const { data, error } = await supabase
    .from('leaderboard_public')
    .select('display_name, avatar_url, score, level_id')
    .order('score', { ascending: false })
    .limit(25)
  if (error) return { rows: [], error: error.message }
  return { rows: data ?? [], error: null }
})

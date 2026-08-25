import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createServerSupabase } from '~/lib/supabase/server'
import { userIdFromRequest } from './session'

async function client() {
  const userId = await userIdFromRequest()
  if (!userId) return null
  const { getRequestHeader } = await import('@tanstack/react-start/server')
  const supabase = createServerSupabase(getRequestHeader('cookie'))
  if (!supabase) return null
  return { supabase, userId }
}

export const respondFriendRequest = createServerFn({ method: 'POST' })
  .validator(z.object({ displayName: z.string().min(1).max(40), accept: z.boolean() }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) throw new Error('Cloud docking is offline')
    const { data: target, error } = await ctx.supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', data.displayName)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!target?.id) throw new Error('No pilot by that callsign')
    const { error: upd } = await ctx.supabase
      .from('friendships')
      .update({ status: data.accept ? 'accepted' : 'declined' })
      .eq('addressee', ctx.userId)
      .eq('requester', target.id)
      .eq('status', 'pending')
    if (upd) throw new Error(upd.message)
    return { ok: true }
  })

async function profileByName(supabase: NonNullable<Awaited<ReturnType<typeof client>>>['supabase'], name: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .ilike('display_name', name)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('No pilot by that callsign')
  return data
}

async function requireCrew(
  supabase: NonNullable<Awaited<ReturnType<typeof client>>>['supabase'],
  userId: string,
  otherId: string,
) {
  const { data } = await supabase
    .from('friendships')
    .select('status')
    .eq('status', 'accepted')
    .or(
      `and(requester.eq.${userId},addressee.eq.${otherId}),and(requester.eq.${otherId},addressee.eq.${userId})`,
    )
    .maybeSingle()
  if (!data) throw new Error('Not in your crew yet')
}

export const sendCrewGift = createServerFn({ method: 'POST' })
  .validator(z.object({ displayName: z.string().min(1), kind: z.enum(['life', 'item']), itemId: z.string().optional() }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) throw new Error('Cloud docking is offline')
    const target = await profileByName(ctx.supabase, data.displayName)
    if (target.id === ctx.userId) throw new Error('Cannot gift yourself')
    await requireCrew(ctx.supabase, ctx.userId, target.id)
    const { error } = await ctx.supabase.from('crew_gifts').insert({
      sender: ctx.userId,
      recipient: target.id,
      kind: data.kind,
      item_id: data.itemId ?? null,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const postCrewMessage = createServerFn({ method: 'POST' })
  .validator(z.object({ displayName: z.string().min(1), body: z.string().min(1).max(180) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) throw new Error('Cloud docking is offline')
    const target = await profileByName(ctx.supabase, data.displayName)
    if (target.id === ctx.userId) throw new Error('Cannot signal yourself')
    await requireCrew(ctx.supabase, ctx.userId, target.id)
    const { error } = await ctx.supabase.from('crew_messages').insert({
      sender: ctx.userId,
      recipient: target.id,
      body: data.body,
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  })

export const submitDailyScore = createServerFn({ method: 'POST' })
  .validator(z.object({ day: z.string().min(8), score: z.number().int().nonnegative() }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) return { ok: false as const }
    const { error } = await ctx.supabase.from('daily_scores').upsert({
      user_id: ctx.userId,
      day: data.day,
      score: data.score,
    })
    if (error) throw new Error(error.message)
    return { ok: true as const }
  })

export const listIncomingGifts = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await client()
  if (!ctx) return [] as Array<{ id: string; from: string; kind: 'life' | 'item'; itemId: string | null }>
  const { data: rows, error } = await ctx.supabase
    .from('crew_gifts')
    .select('id, sender, kind, item_id')
    .eq('recipient', ctx.userId)
    .is('claimed_at', null)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  const ids = [...new Set((rows ?? []).map((r) => r.sender))]
  if (!ids.length) return []
  const { data: profiles } = await ctx.supabase.from('profiles').select('id, display_name').in('id', ids)
  const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? 'Pilot']))
  return (rows ?? []).map((r) => ({
    id: r.id as string,
    from: names.get(r.sender) ?? 'Pilot',
    kind: r.kind as 'life' | 'item',
    itemId: (r.item_id as string | null) ?? null,
  }))
})

export const claimCrewGift = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) throw new Error('Cloud docking is offline')
    const { data: row, error } = await ctx.supabase
      .from('crew_gifts')
      .select('id, kind, item_id, claimed_at, recipient')
      .eq('id', data.id)
      .eq('recipient', ctx.userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) throw new Error('Gift not found')
    if (row.claimed_at) throw new Error('Already claimed')
    const { error: upd } = await ctx.supabase
      .from('crew_gifts')
      .update({ claimed_at: new Date().toISOString() })
      .eq('id', data.id)
      .eq('recipient', ctx.userId)
    if (upd) throw new Error(upd.message)
    return { kind: row.kind as 'life' | 'item', itemId: (row.item_id as string | null) ?? null }
  })

export const listCrewMessages = createServerFn({ method: 'GET' })
  .validator(z.object({ displayName: z.string().min(1) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) return [] as Array<{ from: string; body: string; at: string }>
    const target = await profileByName(ctx.supabase, data.displayName)
    const { data: rows, error } = await ctx.supabase
      .from('crew_messages')
      .select('sender, body, created_at')
      .or(
        `and(sender.eq.${ctx.userId},recipient.eq.${target.id}),and(sender.eq.${target.id},recipient.eq.${ctx.userId})`,
      )
      .order('created_at', { ascending: false })
      .limit(20)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r) => ({
      from: r.sender === ctx.userId ? 'You' : data.displayName,
      body: r.body as string,
      at: r.created_at as string,
    }))
  })

export const fetchDailyBoard = createServerFn({ method: 'GET' })
  .validator(z.object({ day: z.string().min(8) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) return [] as Array<{ display_name: string; score: number }>
    const { data: rows, error } = await ctx.supabase
      .from('daily_scores')
      .select('score, user_id')
      .eq('day', data.day)
      .order('score', { ascending: false })
      .limit(25)
    if (error) throw new Error(error.message)
    const ids = [...new Set((rows ?? []).map((r) => r.user_id))]
    if (!ids.length) return []
    const { data: profiles } = await ctx.supabase.from('profiles').select('id, display_name').in('id', ids)
    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name ?? 'Pilot']))
    return (rows ?? []).map((r) => ({ display_name: names.get(r.user_id) ?? 'Pilot', score: r.score }))
  })

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createServerSupabase } from '~/lib/supabase/server'
import { userIdFromRequest } from './session'

export type FriendCard = {
  displayName: string
  avatarUrl: string | null
  lastNebula: string
  lastActive: string
  pending?: boolean
  incoming?: boolean
}

function ago(iso: string | null | undefined): string {
  if (!iso) return 'unknown'
  const ms = Date.now() - new Date(iso).getTime()
  const h = Math.max(0, Math.floor(ms / 3_600_000))
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

async function client() {
  const userId = await userIdFromRequest()
  if (!userId) return null
  const { getRequestHeader } = await import('@tanstack/react-start/server')
  const supabase = createServerSupabase(getRequestHeader('cookie'))
  if (!supabase) return null
  return { supabase, userId }
}

export const searchPilots = createServerFn({ method: 'GET' })
  .validator(z.object({ name: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) return { cloud: false as const, pilots: [] as FriendCard[] }
    const { data: rows, error } = await ctx.supabase
      .from('profiles')
      .select('display_name, avatar_url, last_nebula_name, last_active_at')
      .ilike('display_name', `%${data.name.replace(/[%_]/g, '')}%`)
      .limit(12)
    if (error) throw new Error(error.message)
    return {
      cloud: true as const,
      pilots: (rows ?? []).map((r) => ({
        displayName: r.display_name ?? 'Pilot',
        avatarUrl: r.avatar_url,
        lastNebula: r.last_nebula_name ?? 'Deep space',
        lastActive: ago(r.last_active_at),
      })),
    }
  })

export const listFriends = createServerFn({ method: 'GET' }).handler(async () => {
  const ctx = await client()
  if (!ctx) return { cloud: false as const, friends: [] as FriendCard[] }
  const { data: rows, error } = await ctx.supabase
    .from('friendships')
    .select('requester, addressee, status')
    .or(`requester.eq.${ctx.userId},addressee.eq.${ctx.userId}`)
  if (error) throw new Error(error.message)
  const otherIds = [...new Set((rows ?? []).map((r) => (r.requester === ctx.userId ? r.addressee : r.requester)))]
  if (!otherIds.length) return { cloud: true as const, friends: [] as FriendCard[] }
  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('id, display_name, avatar_url, last_nebula_name, last_active_at')
    .in('id', otherIds)
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]))
  const friends: FriendCard[] = []
  for (const row of rows ?? []) {
    const other = row.requester === ctx.userId ? row.addressee : row.requester
    const p = byId.get(other)
    if (!p) continue
    friends.push({
      displayName: p.display_name ?? 'Pilot',
      avatarUrl: p.avatar_url,
      lastNebula: p.last_nebula_name ?? 'Deep space',
      lastActive: ago(p.last_active_at),
      pending: row.status === 'pending',
      incoming: row.status === 'pending' && row.addressee === ctx.userId,
    })
  }
  return { cloud: true as const, friends }
})

export const sendFriendRequest = createServerFn({ method: 'POST' })
  .validator(z.object({ displayName: z.string().min(1).max(40) }))
  .handler(async ({ data }) => {
    const ctx = await client()
    if (!ctx) throw new Error('Cloud docking is offline')
    const { data: target, error } = await ctx.supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', data.displayName)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!target?.id) throw new Error('No pilot by that callsign')
    if (target.id === ctx.userId) throw new Error('Cannot add yourself')
    const { error: ins } = await ctx.supabase.from('friendships').insert({
      requester: ctx.userId,
      addressee: target.id,
      status: 'pending',
    })
    if (ins) throw new Error(ins.message)
    return { ok: true, displayName: target.display_name }
  })

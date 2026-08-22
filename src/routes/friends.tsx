import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LOCAL_CREW } from '~/data/friends'
import { addLocalFriend, getLocalFriends } from '~/lib/progress'
import { supabaseConfigured } from '~/lib/supabase/client'
import { listFriends, searchPilots, sendFriendRequest, type FriendCard } from '~/server/friends'

export const Route = createFileRoute('/friends')({
  component: FriendsPage,
})

function cardKey(c: FriendCard) {
  return `${c.displayName}:${c.lastNebula}`
}

function FriendsPage() {
  const cloud = supabaseConfigured()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<FriendCard[]>([])
  const [crew, setCrew] = useState<FriendCard[]>(() =>
    getLocalFriends().map((f) => ({
      displayName: f.displayName,
      avatarUrl: null,
      lastNebula: f.lastNebula,
      lastActive: f.lastActive,
    })),
  )
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    if (!cloud) return
    void listFriends()
      .then((listed) => {
        if (listed.friends.length) setCrew(listed.friends)
      })
      .catch(() => {})
  }, [cloud])

  const search = async () => {
    setErr(null)
    const q = query.trim()
    if (!q) return
    if (!cloud) {
      setHits(LOCAL_CREW.filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase())).map((p) => ({
        displayName: p.displayName,
        avatarUrl: null,
        lastNebula: p.lastNebula,
        lastActive: p.lastActive,
      })))
      setNote('Cloud docking is offline — showing local crew beacons.')
      return
    }
    try {
      const res = await searchPilots({ data: { name: q } })
      setHits(res.pilots)
      setNote(res.cloud ? null : 'Cloud docking is offline.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Search failed')
    }
  }

  const add = async (name: string) => {
    setErr(null)
    if (!cloud) {
      const mock = LOCAL_CREW.find((p) => p.displayName === name)
      const res = addLocalFriend(mock ?? { displayName: name, lastNebula: 'Unknown wake', lastActive: 'just now', avatar: name[0] ?? '?' })
      if (res.error) setErr(res.error)
      else {
        setCrew(getLocalFriends().map((f) => ({
          displayName: f.displayName,
          avatarUrl: null,
          lastNebula: f.lastNebula,
          lastActive: f.lastActive,
        })))
        setNote(`Added ${name}`)
      }
      return
    }
    try {
      await sendFriendRequest({ data: { displayName: name } })
      setNote(`Request sent to ${name}`)
      const listed = await listFriends()
      setCrew(listed.friends)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not add')
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <Link to="/profile" className="text-[12px] text-white/60">
        ← Pilot
      </Link>
      <h1 className="display text-[28px] text-gold">Crew</h1>
      <p className="text-[13px] text-white/70">Search by callsign. Raw IDs stay off the glass.</p>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-[15px]"
          placeholder="Display name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="rounded-full bg-magenta px-3 py-2 text-[12px] font-semibold">
          Scan
        </button>
      </form>
      {note ? <p className="text-[12px] text-cyan-200/80">{note}</p> : null}
      {err ? <p className="text-[12px] text-red-300">{err}</p> : null}
      {hits.length ? (
        <ul className="space-y-2">
          {hits.map((p) => (
            <li key={cardKey(p)} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <PilotRow card={p} />
              <button type="button" className="text-[11px] text-gold" onClick={() => void add(p.displayName)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      ) : query && !err ? (
        <p className="text-[13px] text-white/50">No crew on this frequency.</p>
      ) : null}
      <h2 className="display text-[20px] text-gold">Your crew</h2>
      <ul className="space-y-2">
        {crew.length === 0 ? (
          <li className="text-[13px] text-white/50">No wingmates yet. Scan a callsign to send a ping.</li>
        ) : (
          crew.map((p) => (
            <li key={cardKey(p)} className="rounded-xl bg-white/5 px-3 py-2">
              <PilotRow card={p} />
              {p.pending ? (
                <p className="text-[11px] text-magenta">{p.incoming ? 'Incoming request' : 'Pending'}</p>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

function PilotRow({ card }: { card: FriendCard }) {
  return (
    <div className="flex items-center gap-2">
      {card.avatarUrl ? (
        <img src={card.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-full bg-magenta/40 text-[12px]">
          {card.displayName[0]}
        </span>
      )}
      <div>
        <div className="text-[14px]">{card.displayName}</div>
        <div className="text-[11px] text-white/50">
          {card.lastNebula} · {card.lastActive}
        </div>
      </div>
    </div>
  )
}

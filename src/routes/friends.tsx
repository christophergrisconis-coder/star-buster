import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { LOCAL_CREW } from '~/data/friends'
import { dispatchChat, dispatchLifeGift } from '~/lib/crewCloud'
import { addLocalFriend, consumeItem, getLocalFriends, grantItem, grantLives, spendLife } from '~/lib/progress'
import {
  claimDailyCrewPulse,
  claimGift,
  getMail,
  getPendingCrew,
  incomingGifts,
  respondLocalRequest,
  seedIncomingPing,
  sendLocalRequest,
  type MailItem,
} from '~/lib/social'
import { supabaseConfigured } from '~/lib/supabase/client'
import { listFriends, searchPilots, sendFriendRequest, type FriendCard } from '~/server/friends'
import { claimCrewGift, listCrewMessages, listIncomingGifts, respondFriendRequest } from '~/server/social'

export const Route = createFileRoute('/friends')({
  component: FriendsPage,
})

function cardKey(c: FriendCard) {
  return `${c.displayName}:${c.lastNebula}`
}

type CloudGift = {
  id: string
  from: string
  kind: 'life' | 'item'
  itemId: string | null
  body: string
  cloud: true
}

function isCloudGift(g: MailItem | CloudGift): g is CloudGift {
  return 'cloud' in g && g.cloud === true
}

function FriendsPage() {
  const cloud = supabaseConfigured()
  const [query, setQuery] = useState('')
  const [chat, setChat] = useState('')
  const [hits, setHits] = useState<FriendCard[]>([])
  const [crew, setCrew] = useState<FriendCard[]>(() =>
    getLocalFriends().map((f) => ({
      displayName: f.displayName,
      avatarUrl: null,
      lastNebula: f.lastNebula,
      lastActive: f.lastActive,
    })),
  )
  const [pending, setPending] = useState(() => getPendingCrew())
  const [gifts, setGifts] = useState<Array<MailItem | CloudGift>>(() => incomingGifts())
  const [mail, setMail] = useState(() => getMail())
  const [chatTo, setChatTo] = useState<string | null>(null)
  const [cloudChat, setCloudChat] = useState<Array<{ from: string; body: string; at: string }>>([])
  const [err, setErr] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const refreshLocal = () => {
    if (!cloud) {
      setCrew(
        getLocalFriends().map((f) => ({
          displayName: f.displayName,
          avatarUrl: null,
          lastNebula: f.lastNebula,
          lastActive: f.lastActive,
        })),
      )
    }
    setPending(getPendingCrew())
    setMail(getMail())
    if (!cloud) setGifts(incomingGifts())
    else void loadCloudBay()
  }

  const loadCloudBay = async () => {
    if (!cloud) return
    try {
      const remote = await listIncomingGifts()
      const mapped: CloudGift[] = remote.map((g) => ({
        ...g,
        cloud: true,
        body: g.kind === 'life' ? `${g.from} sent a pulse` : `${g.from} sent kit`,
      }))
      setGifts([...mapped, ...incomingGifts()])
    } catch {
      setGifts(incomingGifts())
    }
  }

  useEffect(() => {
    seedIncomingPing()
    refreshLocal()
    if (!cloud) return
    void listFriends()
      .then((listed) => {
        if (listed.friends.length) setCrew(listed.friends)
      })
      .catch(() => {})
    void loadCloudBay()
  }, [cloud])

  const docked = crew.filter((p) => !p.pending)
  useEffect(() => {
    if (!chatTo && docked[0]) setChatTo(docked[0].displayName)
  }, [chatTo, docked])

  useEffect(() => {
    if (!cloud || !chatTo) {
      setCloudChat([])
      return
    }
    void listCrewMessages({ data: { displayName: chatTo } })
      .then(setCloudChat)
      .catch(() => setCloudChat([]))
  }, [cloud, chatTo])

  const search = async () => {
    setErr(null)
    const q = query.trim()
    if (!q) return
    if (!cloud) {
      setHits(
        LOCAL_CREW.filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase())).map((p) => ({
          displayName: p.displayName,
          avatarUrl: null,
          lastNebula: p.lastNebula,
          lastActive: p.lastActive,
        })),
      )
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
      const ping = sendLocalRequest(name)
      if (ping.error) setErr(ping.error)
      else setNote(`Request pending for ${name}`)
      refreshLocal()
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

  const respond = async (name: string, accept: boolean) => {
    if (!cloud) {
      const res = respondLocalRequest(name, accept, addLocalFriend)
      if (res.error) setErr(res.error)
      else setNote(accept ? `Docked with ${name}` : `Declined ${name}`)
      refreshLocal()
      return
    }
    try {
      await respondFriendRequest({ data: { displayName: name, accept } })
      const listed = await listFriends()
      setCrew(listed.friends)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not respond')
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <Link to="/profile" className="text-[12px] text-white/60">
        ← Pilot
      </Link>
      <h1 className="display text-[28px] text-gold">Crew</h1>
      <p className="text-[13px] text-white/70">Accept pings, send one pulse, gift kit, keep the channel short.</p>
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
                Request
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {pending.length ? (
        <section>
          <h2 className="display text-[20px] text-gold">Inbox</h2>
          <ul className="mt-2 space-y-2">
            {pending.map((p) => (
              <li key={p.displayName} className="rounded-xl bg-white/5 px-3 py-2">
                <p className="text-[14px]">{p.displayName}</p>
                <p className="text-[11px] text-white/50">
                  {p.lastNebula} · {p.incoming ? 'Incoming' : 'Outgoing'}
                </p>
                {p.incoming ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="text-[11px] text-gold" onClick={() => void respond(p.displayName, true)}>
                      Accept
                    </button>
                    <button type="button" className="text-[11px] text-white/50" onClick={() => void respond(p.displayName, false)}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-magenta">Pending</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gifts.length ? (
        <section>
          <h2 className="display text-[20px] text-gold">Bay gifts</h2>
          <ul className="mt-2 space-y-2">
            {gifts.map((g) => (
              <li key={g.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                <span className="text-[12px] text-white/80">{g.body}</span>
                <button
                  type="button"
                  className="text-[11px] text-gold"
                  onClick={() => {
                    void (async () => {
                      if (isCloudGift(g)) {
                        if (g.kind === 'life') {
                          if (!grantLives(1)) {
                            setNote('Pulse well is full (5)')
                            return
                          }
                        } else if (g.itemId) grantItem(g.itemId, 1)
                        try {
                          await claimCrewGift({ data: { id: g.id } })
                          setNote('Claimed')
                        } catch (e) {
                          if (g.kind === 'life') spendLife()
                          else if (g.itemId) consumeItem(g.itemId)
                          setErr(e instanceof Error ? e.message : 'Claim failed')
                        }
                        await loadCloudBay()
                        return
                      }
                      const res = claimGift(g.id)
                      setNote(res.error ?? 'Claimed')
                      refreshLocal()
                    })()
                  }}
                >
                  Claim
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <button
        type="button"
        className="text-[12px] text-gold"
        onClick={() => {
          const res = claimDailyCrewPulse()
          setNote(res.error ?? `${res.from} sent a pulse`)
          refreshLocal()
        }}
      >
        Claim today&apos;s crew pulse
      </button>

      <div className="flex items-center justify-between">
        <h2 className="display text-[20px] text-gold">Your crew</h2>
        {docked.length > 0 ? (
          <button
            type="button"
            className="rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-[11px] font-bold text-gold hover:bg-gold/30 active:scale-95 transition-transform"
            onClick={() => {
              void (async () => {
                let sent = 0
                for (const p of docked) {
                  const res = await dispatchLifeGift(p.displayName, cloud)
                  if (!res.error) sent++
                }
                setNote(`⚡ Sent energy pulses to ${sent} wingmate${sent === 1 ? '' : 's'}!`)
                refreshLocal()
              })()
            }}
          >
            ⚡ Pulse All Wingmates ({docked.length})
          </button>
        ) : null}
      </div>
      <ul className="space-y-2">
        {crew.length === 0 ? (
          <li className="text-[13px] text-white/50">No wingmates yet. Scan a callsign to send a ping.</li>
        ) : (
          crew.map((p) => (
            <li key={cardKey(p)} className="rounded-xl bg-white/5 px-3 py-2">
              <PilotRow card={p} />
              {p.pending ? (
                p.incoming ? (
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="text-[11px] text-gold" onClick={() => void respond(p.displayName, true)}>
                      Accept
                    </button>
                    <button type="button" className="text-[11px] text-white/50" onClick={() => void respond(p.displayName, false)}>
                      Decline
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-magenta">Pending</p>
                )
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-[11px] text-gold"
                    onClick={() => {
                      void (async () => {
                        const res = await dispatchLifeGift(p.displayName, cloud)
                        setNote(res.error ?? `Pulse sent to ${p.displayName}`)
                        refreshLocal()
                      })()
                    }}
                  >
                    Send pulse
                  </button>
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {docked.length ? (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            const to = chatTo ?? docked[0]?.displayName
            if (!to) return
            void (async () => {
              const res = await dispatchChat(to, chat, cloud)
              setNote(res.error ?? 'Signal sent')
              setChat('')
              refreshLocal()
              if (cloud) {
                void listCrewMessages({ data: { displayName: to } })
                  .then(setCloudChat)
                  .catch(() => {})
              }
            })()
          }}
        >
          <p className="text-[11px] uppercase tracking-widest text-white/45">Channel</p>
          <div className="flex flex-wrap gap-2">
            {docked.map((p) => (
              <button
                key={cardKey(p)}
                type="button"
                className={`rounded-full px-2 py-1 text-[11px] ${chatTo === p.displayName ? 'bg-gold text-black' : 'bg-white/10 text-white/70'}`}
                onClick={() => setChatTo(p.displayName)}
              >
                {p.displayName}
              </button>
            ))}
          </div>
          <input
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[14px]"
            placeholder="Short signal"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
          />
        </form>
      ) : null}

      {cloudChat.length ? (
        <ul className="space-y-1">
          {cloudChat.map((m, i) => (
            <li key={`${m.at}-${i}`} className="text-[12px] text-white/55">
              {m.from}: {m.body}
            </li>
          ))}
        </ul>
      ) : null}

      {mail.slice(0, 6).length ? (
        <ul className="space-y-1">
          {mail.slice(0, 6).map((m) => (
            <li key={m.id} className="text-[12px] text-white/55">
              {m.body}
            </li>
          ))}
        </ul>
      ) : null}
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

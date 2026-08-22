import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getSessionUser } from '~/server/session'
import { getInventory, getProgress, grantAdminKit, isAdminPilot, setAdminPilot } from '~/lib/progress'
import { ProfileSkeleton } from '~/ui/skeletons'
import { createBrowserSupabase } from '~/lib/supabase/client'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    const session = await getSessionUser()
    if (typeof window !== 'undefined') {
      const sb = createBrowserSupabase()
      if (sb) {
        const { data } = await sb.auth.getSession()
        if (data.session) return { session: data.session }
      }
    }
    if (!session) throw redirect({ to: '/auth' })
    return { session }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: () => getSessionUser(),
  })
  const inv = typeof window === 'undefined' ? null : getInventory()
  const progress = typeof window === 'undefined' ? null : getProgress()
  const [taps, setTaps] = useState(0)
  const [admin, setAdmin] = useState(() => (typeof window === 'undefined' ? false : isAdminPilot()))
  const [adminNote, setAdminNote] = useState<string | null>(null)
  if (q.isPending && !inv) return <ProfileSkeleton />
  const completed = progress ? Object.values(progress.levels).filter((l) => l.completed).length : 0
  return (
    <div className="space-y-4 px-4 pt-4">
      <h1
        className="display text-[28px] text-gold"
        onClick={() => {
          const next = taps + 1
          setTaps(next)
          if (next >= 7) {
            setAdminPilot(true)
            setAdmin(true)
            setAdminNote('Admin unlocked')
          }
        }}
      >
        Pilot Dossier
      </h1>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-magenta/30 text-[22px]">
          {(q.data?.profile?.display_name ?? 'G')[0]}
        </div>
        <div>
          <div className="text-[16px]">{q.data?.profile?.display_name ?? 'Guest merge pending'}</div>
          <div className="text-[12px] text-white/50">{q.data?.profile ? 'Signed in' : 'local orbit'}</div>
        </div>
      </div>
      <Link to="/friends" className="block rounded-full border border-gold/40 py-2 text-center text-[13px] text-gold">
        Crew list
      </Link>
      <p className="text-[12px] text-white/55">
        {q.data?.profile
          ? 'Signed-in pilots keep the 250-level lock and can post to the board.'
          : 'Guest clears on 1–3 merge the first time you dock.'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Cleared" value={String(completed)} />
        <Stat label="Coins" value={String(inv?.coins ?? 0)} />
        <Stat label="Stardust" value={String(inv?.stardust ?? 0)} />
        <Stat label="Skin" value={inv?.skin ?? 'nova-gold'} />
      </div>
      {admin ? (
        <div className="rounded-2xl border border-gold/30 bg-black/30 p-3">
          <p className="text-[11px] uppercase tracking-widest text-gold">Admin</p>
          <p className="mt-1 text-[12px] text-white/60">Test kits are not given to pilots. Grant charges here only.</p>
          <button
            type="button"
            className="mt-2 rounded-full bg-gold px-4 py-2 text-[13px] font-semibold text-void"
            onClick={() => {
              const res = grantAdminKit()
              setAdminNote(res.error ?? 'Test kit granted')
            }}
          >
            Grant test kit
          </button>
          {adminNote ? <p className="mt-2 text-[12px] text-gold">{adminNote}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="text-[11px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="display text-[22px] text-gold">{value}</div>
    </div>
  )
}

import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getOwnerCookieSession, getSessionUser } from '~/server/session'
import {
  getInventory,
  getProgress,
  grantAdminKit,
  isAdminPilot,
  setAdminPilot,
  unlockAdminVoyage,
  getEquippedTitle,
  setEquippedTitle,
} from '~/lib/progress'
import { getOwnerSession, OWNER_EMAIL, hydrateOwnerAccess, signOutOwner } from '~/lib/owner'
import { ProfileSkeleton } from '~/ui/skeletons'
import { createBrowserSupabase } from '~/lib/supabase/client'
import { BADGES, PILOT_TITLES } from '~/data/rewards'
import { DailyStreakModal } from '~/ui/DailyStreakModal'
import { canClaimToday } from '~/data/streak'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/profile')({
  beforeLoad: async () => {
    if (typeof window !== 'undefined') {
      hydrateOwnerAccess()
      const owner = getOwnerSession()
      if (owner) return { session: { user: { email: owner.email } } }
      const sb = createBrowserSupabase()
      if (sb) {
        const { data } = await sb.auth.getSession()
        if (data.session) return { session: data.session }
      }
    }
    const ownerCookie = await getOwnerCookieSession()
    if (ownerCookie) return { session: { user: { email: ownerCookie.email } } }
    const session = await getSessionUser()
    if (!session) throw redirect({ to: '/auth' })
    return { session }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const q = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const owner = getOwnerSession()
      if (owner) {
        return {
          id: owner.email,
          profile: { id: owner.email, display_name: owner.displayName, avatar_url: null },
        }
      }
      return getSessionUser()
    },
  })
  const inv = typeof window === 'undefined' ? null : getInventory()
  const progress = typeof window === 'undefined' ? null : getProgress()
  const [taps, setTaps] = useState(0)
  const [admin, setAdmin] = useState(() => (typeof window === 'undefined' ? false : isAdminPilot()))
  const [adminNote, setAdminNote] = useState<string | null>(null)
  const [showStreak, setShowStreak] = useState(false)
  const [streakClaimable, setStreakClaimable] = useState(() => (typeof window === 'undefined' ? false : canClaimToday()))
  const [equipped, setEquipped] = useState(() => (typeof window === 'undefined' ? 'Orbit Cadet' : getEquippedTitle()))

  if (q.isPending && !inv) return <ProfileSkeleton />

  const completed = progress ? Object.values(progress.levels).filter((l) => l.completed).length : 0
  const totalStars = progress ? Object.values(progress.levels).reduce((sum, l) => sum + (l.stars || 0), 0) : 0
  const streakCount = progress?.cometStreak ?? 0

  return (
    <div className="space-y-4 px-4 pt-4 pb-12">
      <div className="flex items-center justify-between">
        <h1
          className="display text-[28px] text-gold cursor-pointer"
          onClick={() => {
            const next = taps + 1
            setTaps(next)
            if (next >= 7) {
              setAdminPilot(true)
              unlockAdminVoyage()
              setAdmin(true)
              setAdminNote('Admin powers activated!')
            }
          }}
        >
          Pilot Dossier
        </h1>
        <button
          type="button"
          onClick={() => setShowStreak(true)}
          className={`rounded-full px-3 py-1 text-[12px] font-bold ${
            streakClaimable
              ? 'animate-pulse bg-gold text-black shadow-[0_0_15px_#ffd24a88]'
              : 'border border-white/20 bg-white/5 text-white/70'
          }`}
        >
          🎁 Daily Streak {streakClaimable ? '• Claim!' : ''}
        </button>
      </div>

      {/* Pilot Card */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-magenta/30 text-[22px] font-bold text-magenta border border-magenta/50">
          {(q.data?.profile?.display_name ?? 'G')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-bold text-white truncate">{q.data?.profile?.display_name ?? 'Guest Pilot'}</div>
          <div className="text-[12px] font-semibold text-gold tracking-wide">✦ {equipped} ✦</div>
          <div className="text-[11px] text-white/40">{q.data?.profile ? 'Signed in' : 'Local orbit session'}</div>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/friends" className="block rounded-xl border border-gold/40 bg-gold/5 py-2.5 text-center text-[13px] font-medium text-gold hover:bg-gold/10">
          👥 Wingmate Crew
        </Link>
        <Link to="/zen" className="block rounded-xl border border-cyan-400/40 bg-cyan-950/20 py-2.5 text-center text-[13px] font-medium text-cyan-200 hover:bg-cyan-900/30">
          🌌 Endless Zen Orbit
        </Link>
      </div>

      {/* Pilot Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Cleared" value={String(completed)} />
        <Stat label="Total Stars" value={`★ ${totalStars}`} />
        <Stat label="Coins" value={String(inv?.coins ?? 0)} />
        <Stat label="Stardust" value={String(inv?.stardust ?? 0)} />
        <Stat label="Comet streak" value={String(streakCount)} />
        <Stat label="Nebula Stamps" value={String(Object.keys(progress?.stamps ?? {}).length)} />
      </div>

      {/* Pilot Call-Sign Titles Selection */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="display text-[18px] text-gold">Call-Sign Titles</h2>
        <p className="text-[12px] text-white/50 mb-3">Equip an earned title to display on your pilot card and crew radar.</p>
        <div className="space-y-1.5">
          {PILOT_TITLES.map((t) => {
            const isUnlocked = t.unlocked(completed, totalStars, streakCount)
            const isCurrent = equipped === t.title
            return (
              <button
                key={t.id}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return
                  setEquippedTitle(t.title)
                  setEquipped(t.title)
                }}
                className={`flex w-full items-center justify-between rounded-xl p-2.5 text-left text-[13px] transition-colors ${
                  isCurrent
                    ? 'border border-gold/60 bg-gold/15 text-gold font-bold'
                    : isUnlocked
                      ? 'bg-white/5 hover:bg-white/10 text-white'
                      : 'bg-black/20 text-white/30 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-[11px] opacity-60">{t.requirement}</div>
                </div>
                <div>{isCurrent ? '✓ Equipped' : isUnlocked ? 'Equip' : '🔒'}</div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Badges Showcase */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="display text-[18px] text-gold">Campaign Badges</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {BADGES.map((b) => {
            const hasBadge = completed >= b.at
            return (
              <div
                key={b.id}
                className={`flex flex-col items-center rounded-xl border p-2 text-center ${
                  hasBadge
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-white/5 bg-black/20 text-white/25 opacity-60'
                }`}
              >
                <div className="text-[24px]">{b.icon}</div>
                <div className="mt-1 text-[11px] font-bold">{b.name}</div>
                <div className="text-[9px] opacity-70">Orbit {b.at}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Admin Panel */}
      {admin ? (
        <div className="rounded-2xl border border-gold/30 bg-black/40 p-4">
          <p className="text-[11px] uppercase tracking-widest text-gold font-bold">⚡ Admin Control Dock</p>
          <p className="mt-1 text-[12px] text-white/60">Infinite power-ups & test kits are activated.</p>
          <button
            type="button"
            className="mt-3 rounded-full bg-gold px-5 py-2 text-[13px] font-bold text-void active:scale-95 transition-transform"
            onClick={() => {
              const res = grantAdminKit()
              setAdminNote(res.error ?? 'All 99x solar kits granted!')
            }}
          >
            Refill All Solar Kits
          </button>
          {adminNote ? <p className="mt-2 text-[12px] text-emerald-400 font-semibold">{adminNote}</p> : null}
        </div>
      ) : null}

      {/* Sign out / Switch Account */}
      <button
        type="button"
        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-[13px] text-white/60 hover:bg-white/10 hover:text-white"
        onClick={() => {
          signOutOwner()
          const sb = createBrowserSupabase()
          if (sb) void sb.auth.signOut()
          window.location.href = '/auth'
        }}
      >
        Sign Out / Switch Pilot
      </button>

      <DailyStreakModal
        isOpen={showStreak}
        onClose={() => setShowStreak(false)}
        onClaimed={() => setStreakClaimable(false)}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-3 border border-white/5">
      <div className="text-[10px] uppercase tracking-widest text-white/40">{label}</div>
      <div className="display text-[20px] text-gold mt-0.5">{value}</div>
    </div>
  )
}

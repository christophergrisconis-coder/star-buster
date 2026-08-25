import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { utcDayKey } from '~/data/daily'
import { currentWeekly, weekKey, weeklyEndsAt } from '~/data/weekly'
import { getProgress } from '~/lib/progress'
import { fetchLeaderboard } from '~/server/leaderboard'
import { fetchDailyBoard } from '~/server/social'
import { ProfileSkeleton } from '~/ui/skeletons'

export const Route = createFileRoute('/leaderboard')({
  component: BoardPage,
})

function useCountdown(target: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000)
    return () => clearInterval(t)
  }, [target])
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  const s = Math.floor((remaining % 60000) / 1000)
  return `${h}h ${m}m ${s}s`
}

function BoardPage() {
  const navigate = useNavigate()
  const day = utcDayKey()
  const localDaily = typeof window === 'undefined' ? 0 : getProgress().dailyBest?.[day] ?? 0
  const streak = typeof window === 'undefined' ? 0 : getProgress().cometStreak ?? 0
  const weekly = currentWeekly()
  const wKey = weekKey()
  const weeklyBest = typeof window === 'undefined' ? 0 : (getProgress() as any).weeklyBest?.[wKey] ?? 0
  const countdown = useCountdown(weeklyEndsAt())
  const q = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => fetchLeaderboard(),
  })
  const daily = useQuery({
    queryKey: ['daily-board', day],
    queryFn: () => fetchDailyBoard({ data: { day } }),
  })
  if (q.isPending) return <ProfileSkeleton />
  if (q.isError) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="display text-[28px] text-gold">Constellation Board</h1>
        <p className="rounded-2xl border border-white/10 bg-black/25 p-3 text-[13px] text-white/70">
          Live board is docked offline. Local pilots still shine — add Supabase keys to publish scores.
        </p>
      </div>
    )
  }
  const rows = q.data ?? []
  return (
    <div className="space-y-3 px-4 pt-4">
      <h1 className="display text-[28px] text-gold">Constellation Board</h1>
      <p className="text-[12px] text-white/55">Comet streak x{streak}</p>
      <button
        type="button"
        className="w-full rounded-full bg-gold py-2 text-[13px] font-semibold text-void"
        onClick={() =>
          navigate({ to: '/play/$levelId', params: { levelId: 'daily' }, search: { challenge: undefined, seed: undefined } })
        }
      >
        Daily orbit · {day}
      </button>
      <p className="text-[12px] text-white/50">Your best today: {localDaily}</p>

      <div className="rounded-2xl border border-magenta/30 bg-magenta/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="display text-[18px] text-magenta">{weekly.title}</h2>
          <span className="text-[11px] text-white/50">{countdown}</span>
        </div>
        <p className="text-[12px] text-white/60">{weekly.blurb}</p>
        <div className="flex items-center gap-3 text-[11px] text-gold">
          <span>Prize: {weekly.stardustPrize} ✦ + {weekly.coinsPrize} coins</span>
        </div>
        {weeklyBest > 0 ? <p className="text-[12px] text-white/50">Your best: {weeklyBest}</p> : null}
        <button
          type="button"
          className="w-full rounded-full bg-magenta py-2 text-[13px] font-semibold text-white"
          onClick={() =>
            navigate({ to: '/play/$levelId', params: { levelId: 'weekly' }, search: { challenge: undefined, seed: undefined } })
          }
        >
          Play weekly challenge
        </button>
      </div>

      {daily.data?.length ? (
        <ol className="space-y-2">
          {daily.data.map((row, i) => (
            <li key={`d-${i}`} className="flex justify-between rounded-xl bg-white/5 px-3 py-2 text-[13px]">
              <span>{row.display_name}</span>
              <span className="text-gold">{row.score}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[12px] text-white/45">Local daily scores stay on this glass until cloud docking is up.</p>
      )}
      <h2 className="display text-[20px] text-gold">Voyage scores</h2>
      <ol className="space-y-2">
        {rows.length === 0 ? (
          <li className="text-[13px] text-white/60">No transmissions yet. Clear a stage signed-in to post.</li>
        ) : (
          rows.map((row, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                {row.avatar_url ? (
                  <img src={row.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-magenta/40 text-[11px]">
                    {(row.display_name ?? 'P')[0]}
                  </span>
                )}
                <span>{row.display_name ?? 'Pilot'}</span>
              </div>
              <span className="text-gold">{row.score}</span>
            </li>
          ))
        )}
      </ol>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '~/server/leaderboard'
import { ProfileSkeleton } from '~/ui/skeletons'

export const Route = createFileRoute('/leaderboard')({
  component: BoardPage,
})

function BoardPage() {
  const q = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => fetchLeaderboard(),
  })
  if (q.isPending) return <ProfileSkeleton />
  if (q.isError) {
    return (
      <div className="p-4">
        <h1 className="display text-[28px] text-gold">Constellation Board</h1>
        <p className="mt-2 text-[13px] text-red-300">
          Live board is offline. Local pilots still shine — connect Supabase to publish scores.
        </p>
      </div>
    )
  }
  const rows = q.data ?? []
  return (
    <div className="space-y-3 px-4 pt-4">
      <h1 className="display text-[28px] text-gold">Constellation Board</h1>
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

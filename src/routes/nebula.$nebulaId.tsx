import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { CAMPAIGN, LEVEL_BY_ID } from '~/data/campaign'
import { challengesForLevel } from '~/data/challenges'
import { explodeThen } from '~/fx/orbExplode'
import { isLevelPlayable, isNebulaUnlocked } from '~/lib/lock'
import { completedChallenges, getProgress } from '~/lib/progress'
import { denyEntry } from '~/ui/deny'

export const Route = createFileRoute('/nebula/$nebulaId')({
  beforeLoad: ({ params }) => {
    if (typeof window === 'undefined') return
    if (!isNebulaUnlocked(params.nebulaId, getProgress())) throw redirect({ to: '/' })
  },
  component: NebulaPage,
})

function NebulaPage() {
  const { nebulaId } = Route.useParams()
  const nebula = CAMPAIGN.nebulas.find((n) => n.id === nebulaId)
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  const [burst, setBurst] = useState<string | null>(null)
  if (!nebula) return <p className="p-4">Unknown nebula.</p>
  const stages = CAMPAIGN.stages.filter((s) => s.nebulaId === nebula.id)

  return (
    <div className="relative min-h-[70vh]">
      <div className="relative z-10 space-y-4 px-4 pt-4">
        <Link to="/system/$systemId" params={{ systemId: nebula.systemId }} className="text-[12px] text-white/60">
          ← System
        </Link>
        <h1 className="display text-[28px] text-gold">{nebula.name}</h1>
        <p className="text-[13px] text-white/70">Tap a glowing orb. It detonates into a cluster of stages.</p>
        <div className="flex flex-wrap gap-5 pt-2">
          {stages.map((stage, idx) => {
            const first = stage.levelIds[0]!
            const open = isLevelPlayable(first, progress)
            const hue = (idx * 48 + nebula.sectorId * 36) % 360
            const sample = LEVEL_BY_ID[first]
            const challenges = sample ? challengesForLevel(sample) : []
            const done =
              typeof window === 'undefined'
                ? []
                : stage.levelIds.flatMap((lid) => completedChallenges(lid))
            return (
              <div key={stage.id} className="text-center">
                <button
                  type="button"
                  onClick={(e) => {
                    if (!open) {
                      denyEntry(e.currentTarget)
                      return
                    }
                    setBurst(stage.id)
                    explodeThen(() => {
                      document.getElementById(`cluster-${stage.id}`)?.scrollIntoView({ behavior: 'smooth' })
                    }, 360)
                  }}
                  className={`h-16 w-16 rounded-full ${burst === stage.id ? 'star-explode' : ''} ${
                    open ? '' : 'nebula-silhouette'
                  }`}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #fff, hsl(${hue} 90% 60%))`,
                    boxShadow: open ? `0 0 22px hsl(${hue} 90% 60%)` : 'none',
                    animation: open ? 'orb-pulse 2.8s ease-in-out infinite' : undefined,
                    opacity: open ? 1 : 0.35,
                  }}
                />
                <div className="mt-1 text-[11px] text-white/70">{open ? stage.name : 'Locked cluster'}</div>
                {open && challenges.length ? (
                  <p className="mx-auto mt-1 max-w-[160px] text-[10px] leading-snug text-cyan-200/80">
                    {challenges[0]!.title}
                    {done.length ? ` · ${done.length} wake(s) sealed` : ''}
                  </p>
                ) : null}
                <div id={`cluster-${stage.id}`} className="mt-2 flex max-w-[140px] flex-wrap justify-center gap-1">
                  {burst === stage.id || (open && first <= 3)
                    ? stage.levelIds.map((lid) => {
                        const playable = isLevelPlayable(lid, progress)
                        return playable ? (
                          <Link
                            key={lid}
                            to="/play/$levelId"
                            params={{ levelId: String(lid) }}
                            search={{ challenge: undefined }}
                            className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-[11px] text-gold"
                          >
                            {lid}
                          </Link>
                        ) : (
                          <button
                            key={lid}
                            type="button"
                            onClick={(e) => denyEntry(e.currentTarget)}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-[11px] text-white/30 nebula-silhouette"
                          >
                            {lid}
                          </button>
                        )
                      })
                    : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

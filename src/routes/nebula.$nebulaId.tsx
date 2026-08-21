import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CAMPAIGN } from '~/data/campaign'
import { explodeThen } from '~/fx/orbExplode'
import { UniverseBackground } from '~/fx/universeBackground'
import { highestUnlocked } from '~/lib/progress'

export const Route = createFileRoute('/nebula/$nebulaId')({
  component: NebulaPage,
})

function NebulaPage() {
  const { nebulaId } = Route.useParams()
  const nebula = CAMPAIGN.nebulas.find((n) => n.id === nebulaId)
  const unlocked = typeof window === 'undefined' ? 3 : highestUnlocked()
  const [burst, setBurst] = useState<string | null>(null)
  if (!nebula) return <p className="p-4">Unknown nebula.</p>
  const stages = CAMPAIGN.stages.filter((s) => s.nebulaId === nebula.id)

  return (
    <div className="relative min-h-[70vh]">
      <UniverseBackground />
      <div className="relative z-10 space-y-4 px-4 pt-4">
        <Link to="/system/$systemId" params={{ systemId: nebula.systemId }} className="text-[12px] text-white/60">
          ← System
        </Link>
        <h1 className="display text-[28px] text-gold">{nebula.name}</h1>
        <p className="text-[13px] text-white/70">Tap a glowing orb. It detonates into a cluster of stages.</p>
        <div className="flex flex-wrap gap-5 pt-2">
          {stages.map((stage, idx) => {
            const first = stage.levelIds[0]!
            const open = first <= unlocked + 1
            const hue = (idx * 48 + nebula.sectorId * 36) % 360
            return (
              <div key={stage.id} className="text-center">
                <button
                  type="button"
                  disabled={!open}
                  onClick={() => {
                    setBurst(stage.id)
                    explodeThen(() => {
                      document.getElementById(`cluster-${stage.id}`)?.scrollIntoView({ behavior: 'smooth' })
                    }, 360)
                  }}
                  className={`h-16 w-16 rounded-full ${burst === stage.id ? 'star-explode' : ''}`}
                  style={{
                    background: `radial-gradient(circle at 30% 30%, #fff, hsl(${hue} 90% 60%))`,
                    boxShadow: `0 0 22px hsl(${hue} 90% 60%)`,
                    animation: 'orb-pulse 2.8s ease-in-out infinite',
                    opacity: open ? 1 : 0.35,
                  }}
                />
                <div className="mt-1 text-[11px] text-white/70">{stage.name}</div>
                <div id={`cluster-${stage.id}`} className="mt-2 flex max-w-[140px] flex-wrap justify-center gap-1">
                  {burst === stage.id || first <= 3
                    ? stage.levelIds.map((lid) => (
                        <Link
                          key={lid}
                          to="/play/$levelId"
                          params={{ levelId: String(lid) }}
                          className="grid h-8 w-8 place-items-center rounded-full bg-gold/20 text-[11px] text-gold"
                        >
                          {lid}
                        </Link>
                      ))
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

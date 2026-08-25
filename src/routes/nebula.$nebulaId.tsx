import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { CAMPAIGN, LEVEL_BY_ID } from '~/data/campaign'
import { challengesForNebula } from '~/data/challenges'
import { requestWarpThen } from '~/fx/warpBurst'
import { isLevelPlayable, isNebulaUnlocked, nebulaLevelIds } from '~/lib/lock'
import { getProgress } from '~/lib/progress'
import { denyEntry } from '~/ui/deny'
import { nebulaTheme, planetLook } from '~/ui/planetLooks'

export const Route = createFileRoute('/nebula/$nebulaId')({
  beforeLoad: ({ params }) => {
    if (typeof window === 'undefined') return
    if (!isNebulaUnlocked(params.nebulaId, getProgress())) throw redirect({ to: '/' })
  },
  component: NebulaPage,
})

function NebulaPage() {
  const { nebulaId } = Route.useParams()
  useEffect(() => {
    document.body.classList.add('voyage-live')
    return () => document.body.classList.remove('voyage-live')
  }, [])
  const nebula = CAMPAIGN.nebulas.find((n) => n.id === nebulaId)
  const navigate = useNavigate()
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  if (!nebula) return <p className="p-4">Unknown nebula.</p>
  const stages = CAMPAIGN.stages.filter((s) => s.nebulaId === nebula.id)
  const system = CAMPAIGN.systems.find((s) => s.id === nebula.systemId)
  const sector = CAMPAIGN.sectors.find((s) => s.id === system?.sectorId)
  const theme = nebulaTheme(nebula.id, sector?.color)
  const worldIndex = Math.max(0, CAMPAIGN.nebulas.findIndex((n) => n.id === nebula.id))
  const look = planetLook(worldIndex + 1)
  const ids = nebulaLevelIds(nebula.id)
  const cleared = ids.filter((id) => progress.levels[id]?.completed).length
  const variants = challengesForNebula(nebula.id)

  return (
    <div className="roadmap">
      <div className="roadmap-wash" aria-hidden style={{ background: theme.mist }} />
      <Link to="/" className="roadmap-back">
        ← Voyage
      </Link>
      <header className="roadmap-mast">
        <p className="pov-kicker">{system?.name} · {sector?.name}</p>
        <h1>{nebula.name}</h1>
        <span className="pov-rule" />
        <p className="pov-deck">
          Clear every orbit on this world to open the next planet. {cleared} / {ids.length} surveyed.
          {ids.every((id) => (progress.levels[id]?.stars ?? 0) >= 3)
            ? ' Three-star stamp sealed — kit dropped to your bay.'
            : ' Three-star every orbit for a stamp reward.'}
        </p>
      </header>

      <div className="roadmap-clusters">
        {stages.map((stage) => (
          <section key={stage.id} className="roadmap-cluster">
            <p className="roadmap-cluster-title">{stage.name}</p>
            <div className="roadmap-orbits">
              {stage.levelIds.map((lid, i) => {
                const playable = isLevelPlayable(lid, progress)
                const done = Boolean(progress.levels[lid]?.completed)
                const name = LEVEL_BY_ID[lid]?.name ?? `Orbit ${lid}`
                const novice = lid <= 10
                return (
                  <button
                    key={lid}
                    type="button"
                    className={`roadmap-orbit${done ? ' roadmap-orbit--done' : ''}${playable ? '' : ' roadmap-orbit--sealed'}`}
                    disabled={!playable}
                    onClick={(e) => {
                      if (!playable) {
                        denyEntry(e.currentTarget)
                        return
                      }
                      requestWarpThen(() =>
                        navigate({
                          to: '/play/$levelId',
                          params: { levelId: String(lid) },
                          search: { challenge: undefined, seed: undefined },
                        }),
                      )
                    }}
                  >
                    <span className="roadmap-orbit-index">{i + 1}</span>
                    <span className="roadmap-orbit-copy">
                      <strong>{name}</strong>
                      <em>{done ? 'Surveyed' : playable ? (novice ? 'Novice orbit' : 'Puzzle orbit') : 'Sealed'}</em>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {variants.length ? (
        <aside className="roadmap-challenges">
          <p className="pov-kicker">Optional challenges</p>
          <ul>
            {variants.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="roadmap-challenge"
                  onClick={() => {
                    const firstOpen = ids.find((id) => isLevelPlayable(id, progress))
                    if (!firstOpen) return
                    requestWarpThen(() =>
                      navigate({
                        to: '/play/$levelId',
                        params: { levelId: String(firstOpen) },
                        search: { challenge: item.kind === 'clear' ? undefined : item.id, seed: undefined },
                      }),
                    )
                  }}
                >
                  <strong>{item.title}</strong>
                  <span>{item.blurb}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      <p className="roadmap-world-note" style={{ color: look.glow }}>
        World {worldIndex + 1} · {look.kind}
      </p>
    </div>
  )
}

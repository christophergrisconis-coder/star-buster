import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { CAMPAIGN } from '~/data/campaign'
import { requestWarpThen } from '~/fx/warpBurst'
import { isNebulaUnlocked, isSystemUnlocked } from '~/lib/lock'
import { getProgress } from '~/lib/progress'
import { denyEntry } from '~/ui/deny'
import { PlanetGlobe } from '~/ui/PlanetGlobe'
import { nebulaTheme, planetLook } from '~/ui/planetLooks'

export const Route = createFileRoute('/system/$systemId')({
  beforeLoad: ({ params }) => {
    if (typeof window === 'undefined') return
    if (!isSystemUnlocked(params.systemId, getProgress())) throw redirect({ to: '/' })
  },
  component: SystemPage,
})

function SystemPage() {
  const { systemId } = Route.useParams()
  const system = CAMPAIGN.systems.find((s) => s.id === systemId)
  const navigate = useNavigate()
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  if (!system) return <p className="p-4">Unknown system.</p>
  const nebulas = CAMPAIGN.nebulas.filter((n) => n.systemId === system.id)
  const sector = CAMPAIGN.sectors.find((s) => s.id === system.sectorId)

  const theme = nebulaTheme(system.id, sector?.color)
  return (
    <div className="map-page">
      <div className="pov-nebula" aria-hidden>
        <span className="pov-cloud pov-cloud-a" style={{ background: theme.mist, opacity: 0.4 }} />
        <span className="pov-cloud pov-cloud-b" style={{ background: theme.bloom, opacity: 0.28 }} />
      </div>
      <Link to="/" className="relative z-[1] text-[12px] text-white/45">
        ← Voyage
      </Link>
      <p className="pov-kicker relative z-[1] mt-3">{sector?.name}</p>
      <h1 className="relative z-[1]">{system.name}</h1>
      <p className="pov-deck relative z-[1] mt-2">Approach a nebula to continue the trail.</p>
      <div className="map-worlds">
        {nebulas.map((n, i) => {
          const open = isNebulaUnlocked(n.id, progress)
          const first = CAMPAIGN.levels.find((l) => l.nebulaId === n.id)
          return (
            <button
              key={n.id}
              type="button"
              className="map-world"
              onClick={(e) => {
                if (!open) {
                  denyEntry(e.currentTarget)
                  return
                }
                requestWarpThen(() => navigate({ to: '/nebula/$nebulaId', params: { nebulaId: n.id } }))
              }}
            >
              <PlanetGlobe look={planetLook(first?.id ?? i + 11)} size="thumb" locked={!open} />
              <span>
                <span className="block text-[16px] text-[#efe6d2]">{open ? n.name : 'Uncharted'}</span>
                <span className="block text-[11px] uppercase tracking-[0.16em] text-white/40">
                  {open ? 'Nebula' : 'Sealed'}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

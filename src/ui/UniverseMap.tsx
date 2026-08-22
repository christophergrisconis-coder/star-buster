import { CAMPAIGN, LEVELS } from '~/data'
import { SuperstarSvg } from '~/ui/Superstar'
import { useOrbExplode } from '~/fx/OrbBurst'
import { Link, useNavigate } from '@tanstack/react-router'

export function UniverseMap({
  unlocked,
}: {
  unlocked: number
}) {
  const { explode, node } = useOrbExplode()
  const navigate = useNavigate()

  return (
    <div className="relative space-y-8 pb-16">
      {node}
      {CAMPAIGN.sectors.map((sector, si) => {
        const systems = CAMPAIGN.systems.filter((s) => s.sectorId === sector.id)
        const firstLevel = LEVELS.find((l) => l.sectorId === sector.id)?.id ?? 1
        const locked = firstLevel > unlocked && firstLevel > 3
        return (
          <section key={sector.id} className="relative">
            <div className="mb-3">
              <p className="font-display text-[10px] uppercase tracking-[0.3em] text-gold">
                Sector {sector.id}
              </p>
              <h2 className="font-display text-2xl" style={{ color: sector.color }}>
                {sector.name}
              </h2>
              <p className="text-sm text-white/60">{sector.tagline}</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute bottom-2 left-3 top-2 w-px bg-gradient-to-b from-gold/80 to-accent/40" />
              {systems.map((system) => (
                <button
                  key={system.id}
                  type="button"
                  disabled={locked}
                  onClick={(e) => {
                    explode(e)
                    window.setTimeout(
                      () => navigate({ to: '/system/$systemId', params: { systemId: system.id } }),
                      280,
                    )
                  }}
                  className="mb-4 flex w-full items-center gap-3 text-left"
                >
                  <span
                    className="relative grid h-12 w-12 place-items-center rounded-full shadow-[0_0_24px_#ff2bd688]"
                    style={{ background: `radial-gradient(circle, ${sector.color}, #120c1c)` }}
                  >
                    <SuperstarSvg color={si % 2 ? 'gold' : 'cyan'} size={28} />
                  </span>
                  <span>
                    <span className="block font-display text-lg">{system.name}</span>
                    <span className="text-xs text-white/50">
                      {system.nebulaIds.length} nebulas
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )
      })}
      <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
        Voyage complete when all <b className="text-gold">{LEVELS.length}</b> levels of the solar
        map are cleared. Guests may chart levels 1–3.
      </div>
      <Link to="/play/$levelId" params={{ levelId: '1' }} search={{ challenge: undefined }} className="hidden">
        play
      </Link>
    </div>
  )
}

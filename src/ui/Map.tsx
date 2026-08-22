import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { CAMPAIGN } from '~/data/campaign'
import { SECTORS } from '~/data/universe'
import { explodeThen } from '~/fx/orbExplode'
import { playDestination } from '~/lib/playLabel'
import { getProgress } from '~/lib/progress'
import { isSectorUnlocked, isSystemUnlocked } from '~/lib/lock'
import { denyEntry } from '~/ui/deny'

export function UniverseMap() {
  const navigate = useNavigate()
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  const [burst, setBurst] = useState<string | null>(null)
  const [dest, setDest] = useState<ReturnType<typeof playDestination> | null>(null)

  useEffect(() => {
    setDest(playDestination())
  }, [])

  const cleared = dest?.cleared ?? 0
  const pct = Math.round((cleared / 250) * 100)

  return (
    <div className="relative min-h-[70vh]">
      <div className="relative z-10 space-y-5 px-3 pb-16 pt-3">
        <header className="text-center">
          <p className="text-[11px] uppercase tracking-[0.32em] text-magenta">Voyage</p>
          <h1 className="display mt-1 text-[28px] leading-none text-gold">Nested systems</h1>
          <p className="mt-2 text-[13px] text-white/70">Tap an unlocked orb. Locked wakes refuse the jump.</p>
          <div className="voyage-meter mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50">
              <span>{dest?.guest ? 'Guest orbit · 1–3 free' : 'Pilot lock'}</span>
              <span>
                {cleared} / 250 · {pct}%
              </span>
            </div>
            <div className="voyage-meter-track" aria-hidden>
              <div className="voyage-meter-fill" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
          </div>
        </header>
        {SECTORS.map((sector) => {
          const systems = CAMPAIGN.systems.filter((s) => s.sectorId === sector.id)
          const open = isSectorUnlocked(sector.id, progress)
          return (
            <section
              key={sector.id}
              className={`rounded-2xl border border-white/10 bg-black/25 p-3 ${open ? '' : 'sector-locked'}`}
            >
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="display text-[21px]" style={{ color: sector.color }}>
                  {sector.name}
                </h2>
                <span className="text-[11px] text-white/50">{open ? `cap ${sector.rewardCap}` : 'locked'}</span>
              </div>
              <p className="mb-3 text-[12px] text-white/60">{sector.tagline}</p>
              <div className="grid grid-cols-2 gap-2">
                {systems.map((sys) => {
                  const sysOpen = isSystemUnlocked(sys.id, progress)
                  const current = dest?.system === sys.name
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={(e) => {
                        if (!sysOpen) {
                          denyEntry(e.currentTarget)
                          return
                        }
                        setBurst(sys.id)
                        explodeThen(() =>
                          navigate({ to: '/system/$systemId', params: { systemId: sys.id } }),
                        )
                      }}
                      className={`orb-card ${burst === sys.id ? 'star-explode' : ''} ${
                        sysOpen ? '' : 'nebula-silhouette'
                      } ${current ? 'orb-card--current' : ''}`}
                    >
                      <span
                        className="orb-dot"
                        style={{
                          background: `radial-gradient(circle at 35% 30%, #fff, ${sector.color} 45%, #0b0614)`,
                          boxShadow: sysOpen ? `0 0 16px ${sector.color}` : 'none',
                          animation: sysOpen ? 'orb-pulse 3.4s ease-in-out infinite' : undefined,
                        }}
                      >
                        {sysOpen ? null : <span className="orb-lock" aria-hidden />}
                      </span>
                      <span className="orb-name">{sys.name}</span>
                      <span className="orb-meta">{sysOpen ? (current ? 'next jump' : 'open') : 'locked'}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

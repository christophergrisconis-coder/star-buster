import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { CAMPAIGN } from '~/data/campaign'
import { SECTORS } from '~/data/universe'
import { explodeThen } from '~/fx/orbExplode'
import { UniverseBackground } from '~/fx/universeBackground'
import { highestUnlocked } from '~/lib/progress'

export function UniverseMap() {
  const navigate = useNavigate()
  const unlocked = typeof window === 'undefined' ? 3 : highestUnlocked()
  const [burst, setBurst] = useState<string | null>(null)

  return (
    <div className="relative min-h-[70vh] overflow-hidden">
      <UniverseBackground />
      <div className="relative z-10 space-y-6 px-3 pb-16 pt-4">
        <header className="text-center">
          <p className="text-[11px] uppercase tracking-[0.3em] text-magenta">Voyage</p>
          <h1 className="display text-[32px] leading-none text-gold">Star Buster</h1>
          <p className="mt-2 text-[13px] text-white/70">Glide the nested systems. Tap an orb to ignite it.</p>
        </header>
        {SECTORS.map((sector) => {
          const systems = CAMPAIGN.systems.filter((s) => s.sectorId === sector.id)
          const first = CAMPAIGN.levels.find((l) => l.sectorId === sector.id)
          const open = first ? first.id <= unlocked + 1 : false
          return (
            <section key={sector.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="display text-[22px]" style={{ color: sector.color }}>
                  {sector.name}
                </h2>
                <span className="text-[11px] text-white/50">cap {sector.rewardCap}</span>
              </div>
              <p className="mb-3 text-[12px] text-white/60">{sector.tagline}</p>
              <div className="flex flex-wrap gap-3">
                {systems.map((sys) => (
                  <button
                    key={sys.id}
                    type="button"
                    disabled={!open}
                    onClick={(e) => {
                      void e
                      setBurst(sys.id)
                      explodeThen(() =>
                        navigate({ to: '/system/$systemId', params: { systemId: sys.id } }),
                      )
                    }}
                    className={`relative h-16 w-16 rounded-full ${burst === sys.id ? 'star-explode' : ''}`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, #fff, ${sector.color} 45%, #0b0614)`,
                      boxShadow: `0 0 18px ${sector.color}`,
                      animation: 'orb-pulse 3.4s ease-in-out infinite',
                      opacity: open ? 1 : 0.35,
                    }}
                  >
                    <span className="sr-only">{sys.name}</span>
                  </button>
                ))}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-white/55">
                {systems.map((sys) => (
                  <li key={`${sys.id}-label`}>{sys.name}</li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

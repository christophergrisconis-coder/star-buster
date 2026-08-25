import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { requestWarpThen } from '~/fx/warpBurst'
import { playDestination } from '~/lib/playLabel'
import { hasCompletedTutorial } from '~/lib/tutorial'
import { synth } from '~/audio/synth'

const FALLBACK = {
  levelId: 1,
  name: 'Amber Veil 1-1',
  system: 'Helios Drift',
  sector: 'Nebula Novice',
}

export function PlayCta() {
  const navigate = useNavigate()
  const [dest, setDest] = useState(FALLBACK)

  useEffect(() => {
    setDest(playDestination())
  }, [])

  return (
    <>
    <button
      type="button"
      onClick={() => {
        const next = playDestination()
        synth.whoosh()
        requestWarpThen(() => {
          if (!hasCompletedTutorial()) {
            void navigate({
              to: '/play/$levelId',
              params: { levelId: 'tutorial' },
              search: { challenge: undefined, seed: undefined },
            })
            return
          }
          void navigate({
            to: '/play/$levelId',
            params: { levelId: String(next.levelId) },
            search: { challenge: undefined, seed: undefined },
          })
        })
      }}
      className="play-cta mt-2 w-full rounded-full px-4 py-2.5 text-void"
    >
      <span className="block text-[13px] font-bold uppercase tracking-[0.22em]">Play</span>
      <span className="mt-0.5 block text-[11px] font-semibold tracking-wide opacity-80">
        {dest.name} · {dest.system}
      </span>
    </button>
    <button
      type="button"
      className="mt-1 w-full text-[11px] text-gold"
      onClick={() => {
        synth.whoosh()
        requestWarpThen(() => {
          void navigate({
            to: '/play/$levelId',
            params: { levelId: 'daily' },
            search: { challenge: undefined, seed: undefined },
          })
        })
      }}
    >
      Daily orbit
    </button>
    </>
  )
}

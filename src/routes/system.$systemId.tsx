import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { CAMPAIGN } from '~/data/campaign'
import { explodeThen } from '~/fx/orbExplode'
import { isNebulaUnlocked, isSystemUnlocked } from '~/lib/lock'
import { getProgress } from '~/lib/progress'
import { denyEntry } from '~/ui/deny'

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
  const [burst, setBurst] = useState<string | null>(null)
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  if (!system) return <p className="p-4">Unknown system.</p>
  const nebulas = CAMPAIGN.nebulas.filter((n) => n.systemId === system.id)

  return (
    <div className="relative min-h-[70vh]">
      <div className="relative z-10 space-y-4 px-4 pt-4">
        <Link to="/" className="text-[12px] text-white/60">
          ← Universe
        </Link>
        <h1 className="display text-[28px] text-gold">{system.name}</h1>
        <p className="text-[13px] text-white/70">Each nebula hides exploding stage orbs.</p>
        <div className="flex flex-wrap gap-4">
          {nebulas.map((n) => {
            const open = isNebulaUnlocked(n.id, progress)
            return (
              <button
                key={n.id}
                type="button"
                onClick={(e) => {
                  if (!open) {
                    denyEntry(e.currentTarget)
                    return
                  }
                  setBurst(n.id)
                  explodeThen(() => navigate({ to: '/nebula/$nebulaId', params: { nebulaId: n.id } }))
                }}
                className={`h-20 w-20 rounded-full ${burst === n.id ? 'star-explode' : ''} ${
                  open ? '' : 'nebula-silhouette'
                }`}
                style={{
                  background: 'radial-gradient(circle at 30% 28%, #fff, #ff2bd6 40%, #1a1230)',
                  boxShadow: open ? '0 0 24px #ff2bd688' : 'none',
                  animation: open ? 'orb-pulse 3s ease-in-out infinite' : undefined,
                  opacity: open ? 1 : 0.4,
                }}
              >
                <span className="sr-only">{open ? n.name : `${n.name} locked`}</span>
              </button>
            )
          })}
        </div>
        <ul className="space-y-1 text-[13px] text-white/70">
          {nebulas.map((n) => (
            <li key={n.id}>{isNebulaUnlocked(n.id, progress) ? n.name : '·····'}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

import { Link, useNavigate } from '@tanstack/react-router'
import { CAMPAIGN } from '~/data/campaign'
import { challengesForNebula } from '~/data/challenges'
import { requestWarpThen } from '~/fx/warpBurst'
import { isNebulaUnlocked, nextPlayTarget } from '~/lib/lock'
import {
  bumpReroll,
  getProgress,
  getRerollSeed,
  itemCount,
  nebulaChallengeComplete,
  skipNextLevel,
} from '~/lib/progress'
import { denyEntry } from '~/ui/deny'
import { synth } from '~/audio/synth'
import { useState } from 'react'

export function ChallengeBoard({ nebulaId }: { nebulaId?: string }) {
  const navigate = useNavigate()
  const progress = typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress()
  const active = nextPlayTarget(progress)
  const selectedId = nebulaId && isNebulaUnlocked(nebulaId, progress) ? nebulaId : active.nebulaId
  const selected = CAMPAIGN.nebulas.find((n) => n.id === selectedId)
  const [rerollTick, setRerollTick] = useState(0)
  const [msg, setMsg] = useState<string | null>(null)
  const seed = selected ? getRerollSeed(selected.id) : 0
  void rerollTick
  const catalog = selected ? challengesForNebula(selected.id, seed) : []

  return (
    <div className="space-y-4 px-4 pt-4 pb-10">
      <h1 className="display text-[28px] text-gold">Quest Board</h1>
      <p className="text-[13px] text-white/70">
        Risk scales the payout. High-risk variants pay more stardust and exclusive badges.
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CAMPAIGN.nebulas.map((n) => {
          const open = isNebulaUnlocked(n.id, progress)
          const current = n.id === selectedId
          return (
            <button
              key={n.id}
              type="button"
              onClick={(e) => {
                if (!open) {
                  denyEntry(e.currentTarget)
                  return
                }
                void navigate({ to: '/challenges/$nebulaId', params: { nebulaId: n.id } })
              }}
              className={`quest-chip ${current ? 'quest-chip--current' : ''} ${open ? '' : 'nebula-silhouette'}`}
            >
              <span
                className="quest-chip-orb"
                style={{
                  background: open
                    ? 'radial-gradient(circle at 30% 28%, #fff, #5ce1ff 42%, #1a1230)'
                    : 'radial-gradient(circle at 30% 28%, #444, #111)',
                }}
              />
              <span className="quest-chip-name">{open ? n.name : 'Locked wake'}</span>
            </button>
          )
        })}
      </div>

      {selected ? (
        <>
          <div className="flex items-baseline justify-between">
            <h2 className="display text-[22px] text-gold">{selected.name}</h2>
            <span className="text-[11px] text-white/50">sector {selected.sectorId}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-white/20 px-3 py-1 text-[11px]"
              onClick={() => {
                const res = bumpReroll(selected.id)
                if (res.error) setMsg(res.error)
                else {
                  setRerollTick((n) => n + 1)
                  setMsg('High-risk slate rerolled')
                  synth.whoosh()
                }
              }}
            >
              Reroll ({itemCount('challenge-reroll')})
            </button>
            <button
              type="button"
              className="rounded-full border border-white/20 px-3 py-1 text-[11px]"
              onClick={() => {
                const res = skipNextLevel()
                setMsg(res.error ?? (res.levelId ? `Skipped orbit #${res.levelId}` : 'Skip failed'))
              }}
            >
              Skip ticket ({itemCount('nebula-skip')})
            </button>
          </div>
          {msg ? <p className="text-[12px] text-cyan-200/80">{msg}</p> : null}
          <ul className="space-y-2">
            {catalog.map((c) => {
              const done = nebulaChallengeComplete(c.id)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      synth.whoosh()
                      requestWarpThen(() => {
                        void navigate({
                          to: '/play/$levelId',
                          params: { levelId: String(active.nebulaId === selected.id ? active.levelId : CAMPAIGN.levels.find((l) => l.nebulaId === selected.id)!.id) },
                          search: { challenge: c.id },
                        })
                      })
                    }}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-magenta">
                          {c.tier === 'high' ? `High risk ${c.risk}` : 'Standard'}
                          {done ? ' · sealed' : ''}
                        </p>
                        <h3 className="display text-[20px] text-gold">{c.title}</h3>
                        <p className="text-[12px] text-white/70">{c.blurb}</p>
                        {c.badge ? <p className="mt-1 text-[11px] text-cyan-200">Badge: {c.badge}</p> : null}
                      </div>
                      <div className="text-right text-[11px] text-gold">
                        <div>{c.stardust} dust</div>
                        <div>{c.stars}★</div>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <p className="text-[13px] text-white/60">No nebula on this frequency.</p>
      )}
      <Link to="/" className="block text-center text-[12px] text-white/50">
        Back to map
      </Link>
    </div>
  )
}

import { useMemo, useState } from 'react'
import type { EngineEvent, GameState } from '~/engine/types'
import { BurstLayer } from '~/fx/particles'
import { StarTile } from './StarTile'

export function Board({
  state,
  onTap,
  hint,
  skin,
  events,
}: {
  state: GameState
  onTap: (index: number) => void
  hint?: { a: number; b: number } | null
  skin?: string
  events: EngineEvent[]
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const destroy = useMemo(() => {
    const last = [...events].reverse().find((e) => e.type === 'wave')
    return last && last.type === 'wave' ? last : null
  }, [events])

  const exploding = new Set(destroy?.destroyed ?? [])
  const spawning = new Set((destroy?.refill ?? []).map((r) => r.index))

  return (
    <div className="relative mx-auto w-[min(100%,360px)]">
      {destroy ? (
        <BurstLayer indices={destroy.destroyed} size={destroy.blast} width={state.width} />
      ) : null}
      <div
        className="grid rounded-2xl border border-white/10 bg-black/30 p-1 shadow-[0_0_40px_#ff2bd633]"
        style={{ gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))` }}
      >
        {state.cells.map((cell, i) => {
          const lit = hint && (hint.a === i || hint.b === i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                setSelected(i)
                onTap(i)
              }}
              className={`aspect-square rounded-md p-0.5 ${lit ? 'ring-2 ring-gold' : ''} ${
                selected === i ? 'ring-2 ring-magenta' : ''
              }`}
            >
              <StarTile
                cell={cell}
                selected={selected === i}
                exploding={exploding.has(i)}
                spawning={spawning.has(i)}
                delay={(i % 8) * 40}
                skin={skin}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

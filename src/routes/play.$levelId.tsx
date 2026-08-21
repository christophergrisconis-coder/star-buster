import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLevel } from '~/data/levels'
import { LEVEL_BY_ID } from '~/data/campaign'
import { createGame, reduce } from '~/engine'
import type { EngineEvent, GameState } from '~/engine/types'
import { useHintCoach } from '~/hint/useHint'
import { Board } from '~/ui/Board'
import { HUD } from '~/ui/HUD'
import { BoardSkeleton } from '~/ui/skeletons'
import { ComboBanner } from '~/fx/comboBanners'
import { synth } from '~/audio/synth'
import { canPlay, consumeItem, getInventory, getProgress, recordWin } from '~/lib/progress'
import { saveProgress, submitScore } from '~/server/progress'

export const Route = createFileRoute('/play/$levelId')({
  component: PlayPage,
  pendingComponent: BoardSkeleton,
})

function PlayPage() {
  const { levelId } = Route.useParams()
  const id = Number(levelId)
  const level = useMemo(() => LEVEL_BY_ID[id] ?? getLevel(id), [id])
  const navigate = useNavigate()
  const [state, setState] = useState<GameState | null>(null)
  const selected = useRef<number | null>(null)
  const hint = useHintCoach()
  const [banner, setBanner] = useState<string | null>(null)
  const [events, setEvents] = useState<EngineEvent[]>([])
  const [booster, setBooster] = useState<'hammer' | 'striped' | 'wrapped' | 'color-bomb' | null>(null)
  const skin = typeof window === 'undefined' ? 'nova-gold' : getInventory().skin

  useEffect(() => {
    if (!level) return
    setState(createGame(level))
    selected.current = null
  }, [level])

  useEffect(() => {
    if (!state || state.status !== 'finale') return
    const t = window.setInterval(() => {
      setState((s) => (s ? reduce(s, { type: 'tick-finale' }) : s))
    }, 420)
    return () => window.clearInterval(t)
  }, [state?.status])

  useEffect(() => {
    if (!state) return
    for (const e of state.events) {
      if (e.type === 'wave') {
        synth.pop(e.combo)
        synth.explode(e.blast)
        if (e.word) {
          setBanner(e.word)
          synth.banner()
        }
      }
      if (e.type === 'invalid-swap') synth.invalid()
      if (e.type === 'swap') synth.swap()
      if (e.type === 'status' && e.status === 'won') {
        synth.win()
        const badge = recordWin(state.levelId, state.score, state.coinsEarned)
        if (badge) setBanner(`BADGE ${badge}`)
        void submitScore({ data: { levelId: state.levelId, score: state.score } }).catch(() => {})
        void saveProgress({
          data: {
            levelId: state.levelId,
            bestScore: state.score,
            stars: state.score > 8000 ? 3 : state.score > 3000 ? 2 : 1,
          },
        }).catch(() => {})
      }
      if (e.type === 'status' && e.status === 'lost') synth.lose()
    }
    setEvents(state.events)
  }, [state])

  if (!level) {
    return <p className="p-4">Unknown stage.</p>
  }
  const guestBlocked = typeof window !== 'undefined' && !canPlay(id, !getProgress().guest)
  if (guestBlocked) {
    return (
      <div className="space-y-3 p-4">
        <h1 className="display text-[28px] text-gold">Orbit locked</h1>
        <p className="text-[13px] text-white/70">Guests may fly levels 1–3. Sign in to continue the 250-level voyage.</p>
        <Link to="/auth" className="inline-block rounded-full bg-magenta px-4 py-2">
          Sign in
        </Link>
      </div>
    )
  }
  if (!state) return <BoardSkeleton />

  const tap = (index: number) => {
    if (state.status !== 'playing') return
    if (booster === 'hammer') {
      consumeItem('hammer')
      setState(reduce(state, { type: 'hammer', index }))
      setBooster(null)
      return
    }
    if (booster === 'striped' || booster === 'wrapped' || booster === 'color-bomb') {
      const idMap = { striped: 'booster-striped', wrapped: 'booster-wrapped', 'color-bomb': 'booster-nova' } as const
      const specialMap = { striped: 'striped-h', wrapped: 'wrapped', 'color-bomb': 'color-bomb' } as const
      consumeItem(idMap[booster])
      setState(reduce(state, { type: 'spawn-special', index, special: specialMap[booster] }))
      setBooster(null)
      return
    }
    if (selected.current === null) {
      selected.current = index
      return
    }
    const a = selected.current
    selected.current = null
    setState(reduce(state, { type: 'swap', a, b: index }))
  }

  return (
    <div className="relative space-y-3 px-3 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate({ to: '/' })} className="text-[12px] text-white/60">
          ← Map
        </button>
        <h1 className="display text-[22px] text-gold">{level.name}</h1>
        <span className="text-[11px] text-white/50">#{level.id}</span>
      </div>
      <HUD
        state={state}
        onHint={() => hint.requestHint(state)}
        hintBusy={hint.busy}
        coachLine={hint.coachLine}
        coachError={hint.coachError}
      />
      <div className="relative">
        <ComboBanner word={banner} combo={state.combo} />
        <Board state={state} onTap={tap} hint={hint.hint} skin={skin} events={events} />
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['hammer', 'Hammer'],
            ['striped', 'Striped'],
            ['wrapped', 'Wrapped'],
            ['color-bomb', 'Nova'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setBooster(id)}
            className={`rounded-full px-3 py-1 text-[12px] ${booster === id ? 'bg-magenta' : 'bg-white/10'}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setState(reduce(state, { type: 'add-moves', count: 5 }))}
          className="rounded-full bg-white/10 px-3 py-1 text-[12px]"
        >
          +5 moves
        </button>
      </div>
      {state.status === 'won' ? (
        <div className="rounded-2xl border border-gold/40 bg-black/40 p-3 text-center">
          <p className="display text-[28px] text-gold">Stage clear</p>
          <Link to="/play/$levelId" params={{ levelId: String(Math.min(250, id + 1)) }} className="mt-2 inline-block text-magenta">
            Next orbit →
          </Link>
        </div>
      ) : null}
      {state.status === 'lost' ? (
        <div className="rounded-2xl border border-red-400/40 bg-black/40 p-3 text-center">
          <p className="display text-[24px]">Drift failed</p>
          <button type="button" className="mt-2 text-gold" onClick={() => setState(createGame(level))}>
            Retry
          </button>
        </div>
      ) : null}
      {state.status === 'finale' ? (
        <p className="text-center text-[13px] text-magenta">Starburst Finale…</p>
      ) : null}
    </div>
  )
}

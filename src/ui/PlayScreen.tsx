import { useEffect, useMemo, useState } from 'react'
import { Board } from './Board'
import { Hud } from './Hud'
import { ComboBanner, BadgeToast } from '~/fx/ComboBanner'
import { createGame, reduce, serializeBoard, type GameState } from '~/engine'
import { LEVEL_BY_ID } from '~/data'
import { loadGuest, recordLevel, saveGuest, starsForScore, GUEST_LEVEL_CAP } from '~/lib/guest'
import { useAudio } from '~/audio/useAudio'
import { useHintWorker } from '~/hint/useHintWorker'
import { coachLineFn, saveProgressFn } from '~/server/fns'
import { Link } from '@tanstack/react-router'
import type { ComboWord, SpecialKind } from '~/engine/types'

export function PlayScreen({ levelId }: { levelId: number }) {
  const config = LEVEL_BY_ID[levelId]
  const audio = useAudio()
  const { requestHint } = useHintWorker()
  const [guest, setGuest] = useState(() => loadGuest())
  const [state, setState] = useState<GameState | null>(null)
  const [exploding, setExploding] = useState<Set<number>>(new Set())
  const [word, setWord] = useState<ComboWord | undefined>()
  const [hint, setHint] = useState<{ a: number; b: number } | null>(null)
  const [coach, setCoach] = useState<string | null>(null)
  const [coachError, setCoachError] = useState<string | null>(null)
  const [badge, setBadge] = useState<string | null>(null)
  const [boostMode, setBoostMode] = useState<'hammer' | null>(null)

  useEffect(() => {
    if (!config) return
    setState(createGame(config))
    setWord(undefined)
    setHint(null)
  }, [config])

  const lockedGuest = levelId > GUEST_LEVEL_CAP && typeof window !== 'undefined' && !localStorage.getItem('sb-session-user')

  const apply = (next: GameState) => {
    setState(next)
    const waves = next.events.filter((e) => e.type === 'wave')
    const last = waves.at(-1)
    if (last && last.type === 'wave') {
      setExploding(new Set(last.destroyed))
      setWord(last.word)
      audio.pop(last.combo)
      window.setTimeout(() => setExploding(new Set()), 280)
    }
    if (next.combo >= 6) setBadge('Galaxy Buster')
    if (next.status === 'won') {
      audio.fanfare()
      const stars = starsForScore(next.score, next.movesLeft)
      const saved = recordLevel(levelId, next.score, stars)
      setGuest(saved)
      void saveProgressFn({
        data: {
          levelId,
          score: next.score,
          stars,
          board: serializeBoard(next),
        },
      }).catch(() => undefined)
    }
    if (next.status === 'lost') audio.whoosh()
  }

  const onSwap = (a: number, b: number) => {
    if (!state || state.status !== 'playing') return
    if (boostMode === 'hammer') {
      apply(reduce(state, { type: 'hammer', index: b }))
      setBoostMode(null)
      return
    }
    audio.whoosh()
    apply(reduce(state, { type: 'swap', a, b }))
  }

  const objectiveLabel = useMemo(() => {
    if (!state) return ''
    return state.status
  }, [state])

  if (!config) {
    return <p className="p-4">Unknown sector coordinate.</p>
  }

  if (lockedGuest) {
    return (
      <div className="space-y-4 p-4">
        <p className="font-display text-2xl">Orbit locked</p>
        <p className="text-sm text-white/70">
          Guests may fly levels 1–3. Sign in to continue the 250-level voyage.
        </p>
        <Link to="/auth" className="inline-block rounded-full bg-accent px-4 py-2">
          Sign in
        </Link>
      </div>
    )
  }

  if (!state) return <p className="p-4">Aligning stars…</p>

  return (
    <div className="relative space-y-4">
      <ComboBanner word={word} streak={state.streak} />
      <BadgeToast text={badge} />
      <Hud
        state={state}
        coins={guest.coins}
        onHint={async () => {
          const move = await requestHint(state)
          if (!move) {
            setCoachError('No mechanical hint found.')
            return
          }
          setHint({ a: move.a, b: move.b })
          try {
            const res = await coachLineFn({ data: { summary: move.summary, move: `${move.a}->${move.b}` } })
            setCoach(res.line)
            setCoachError(res.error)
          } catch (err) {
            setCoachError(err instanceof Error ? err.message : 'AI coach is down.')
          }
        }}
        onBoost={(kind) => {
          if (kind === 'hammer') {
            setBoostMode('hammer')
            return
          }
          const special: SpecialKind =
            kind === 'striped' ? 'striped-h' : kind === 'wrapped' ? 'wrapped' : 'color-bomb'
          const idx = state.cells.findIndex((c) => c.color && c.special === 'none')
          if (idx >= 0) apply(reduce(state, { type: 'spawn-special', index: idx, special }))
          const inv = { ...guest.inventory, [kind]: Math.max(0, (guest.inventory[kind] ?? 1) - 1) }
          const next = { ...guest, inventory: inv }
          saveGuest(next)
          setGuest(next)
        }}
      />
      {coach ? <p className="rounded-xl bg-white/10 px-3 py-2 text-sm italic">{coach}</p> : null}
      {coachError ? <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100">{coachError}</p> : null}
      <Board state={state} exploding={exploding} hint={hint} locked={state.status !== 'playing'} onSwap={onSwap} />
      {state.status !== 'playing' ? (
        <div className="rounded-2xl bg-black/50 p-4 text-center">
          <p className="font-display text-2xl">{state.status === 'won' ? 'Orbit cleared' : 'Signal lost'}</p>
          <p className="text-sm text-white/60">{objectiveLabel}</p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              className="rounded-full bg-white/10 px-4 py-2"
              onClick={() => setState(createGame(config))}
            >
              Retry
            </button>
            <Link
              to="/play/$levelId"
              params={{ levelId: String(Math.min(250, levelId + 1)) }}
              className="rounded-full bg-accent px-4 py-2"
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}

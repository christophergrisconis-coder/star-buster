import { Link, createFileRoute, redirect, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  applyChallengeModifiers,
  challengesForLevel,
  challengeToast,
  evaluateChallenge,
  evaluateNebulaChallenge,
  nebulaChallengeById,
  type ChallengeRun,
} from '~/data/challenges'
import { cometTailDurationMs } from '~/data/difficulty'
import { getLevel } from '~/data/levels'
import { LEVEL_BY_ID } from '~/data/campaign'
import { createGame, reduce } from '~/engine'
import { isSwappable, type GameState } from '~/engine/types'
import { ChallengeToast } from '~/fx/comboBanners'
import { useHintCoach } from '~/hint/useHint'
import { Board } from '~/ui/Board'
import { HUD } from '~/ui/Hud'
import { BoosterTray, readKitCounts, type ArmedBooster, type InstantBooster } from '~/ui/BoosterTray'
import type { ActivePickup } from '~/ui/KitPickup'
import { BoardSkeleton } from '~/ui/skeletons'
import { AuthPanel } from '~/ui/AuthPanel'
import { TutorialCoach } from '~/ui/TutorialCoach'
import { synth } from '~/audio/synth'
import { isLevelPlayable } from '~/lib/lock'
import {
  canPlay,
  completedChallenges,
  consumeAny,
  consumeItem,
  FLARE_ITEM_IDS,
  getInventory,
  getProgress,
  getRerollSeed,
  grantItem,
  itemCount,
  recordWin,
} from '~/lib/progress'
import { kitItemIds, kitLabelForItem, slotById } from '~/data/kit'
import { applyTutorialBoard, LESSONS, TUTORIAL_LEVEL, TUTORIAL_SUN } from '~/data/tutorial'
import { markTutorialComplete } from '~/lib/tutorial'

export const Route = createFileRoute('/play/$levelId')({
  validateSearch: (raw: Record<string, unknown>) => ({
    challenge: typeof raw.challenge === 'string' ? raw.challenge : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (typeof window === 'undefined') return
    if (params.levelId === 'tutorial') return
    const id = Number(params.levelId)
    if (!isLevelPlayable(id, getProgress())) {
      throw redirect({ to: getProgress().guest ? '/auth' : '/' })
    }
  },
  component: PlayPage,
  pendingComponent: BoardSkeleton,
  errorComponent: PlayCrash,
})

function PlayCrash({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-3 p-4">
      <p className="display text-[22px] text-gold">Orbit dropped</p>
      <p className="text-[13px] text-white/70">{error.message}</p>
      <button type="button" className="text-magenta" onClick={reset}>
        Retry this stage
      </button>
    </div>
  )
}

function PlayPage() {
  const { levelId } = useParams({ from: '/play/$levelId' })
  const search = Route.useSearch()
  const isLesson = levelId === 'tutorial'
  const id = isLesson ? 0 : Number(levelId)
  const nebulaChallenge = useMemo(
    () =>
      isLesson
        ? undefined
        : search.challenge
          ? nebulaChallengeById(search.challenge, getRerollSeed(search.challenge.split(':')[0] ?? ''))
          : undefined,
    [search.challenge, isLesson],
  )
  const level = useMemo(() => {
    if (isLesson) return TUTORIAL_LEVEL
    const base = LEVEL_BY_ID[id] ?? getLevel(id)
    if (!base) return undefined
    return nebulaChallenge ? applyChallengeModifiers(base, nebulaChallenge) : base
  }, [id, nebulaChallenge, isLesson])
  const challenges = useMemo(() => (level ? challengesForLevel(level) : []), [level])
  const navigate = useNavigate()
  const [state, setState] = useState<GameState | null>(() => {
    if (!level) return null
    const game = createGame(level)
    return isLesson ? applyTutorialBoard(game) : game
  })
  const playId = useRef(levelId)
  const hint = useHintCoach()
  const [badge, setBadge] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [booster, setBooster] = useState<ArmedBooster | null>(null)
  const [boardBusy, setBoardBusy] = useState(false)
  const [cometRemainMs, setCometRemainMs] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [peakTail, setPeakTail] = useState(0)
  const [sawSpread, setSawSpread] = useState(false)
  const [sawSpecial, setSawSpecial] = useState(false)
  const [lessonIndex, setLessonIndex] = useState(isLesson ? 0 : -1)
  const [tutorialHammer, setTutorialHammer] = useState(isLesson ? 1 : 0)
  const [denyNote, setDenyNote] = useState<string | null>(null)
  const [kitTick, setKitTick] = useState(0)
  const [kitCounts, setKitCounts] = useState(readKitCounts)
  const [pickup, setPickup] = useState<ActivePickup | null>(null)
  const [kitNote, setKitNote] = useState<string | null>(null)
  const nebulaBoostUsed = useRef(false)
  const awardedRef = useRef(false)
  const tailPause = useRef(0)
  const tailDeadline = useRef<number | null>(null)
  const skin = typeof window === 'undefined' ? 'nova-gold' : getInventory().skin
  const cometMs = level ? cometTailDurationMs(level.sectorId) : 4800
  const noBoosters = Boolean(nebulaChallenge?.modifiers.noBoosters)
  const guestBlocked = typeof window !== 'undefined' && !isLesson && !canPlay(id)
  const lesson = isLesson && lessonIndex >= 0 ? LESSONS[lessonIndex] : null
  const clockPaused = Boolean(lesson && lesson.wait !== 'win')

  const resetRun = (next: GameState) => {
    awardedRef.current = false
    setHintUsed(false)
    setPeakTail(0)
    setSawSpread(false)
    setSawSpecial(false)
    setToast(null)
    setBadge(null)
    setCometRemainMs(0)
    tailDeadline.current = null
    tailPause.current = 0
    setBooster(null)
    setPickup(null)
    nebulaBoostUsed.current = false
    setState(isLesson ? applyTutorialBoard(next) : next)
    if (isLesson) {
      setLessonIndex(0)
      setTutorialHammer(1)
    }
  }

  const advanceLesson = () => {
    setLessonIndex((i) => Math.min(LESSONS.length - 1, i + 1))
  }

  const skipSchool = () => {
    markTutorialComplete()
    void navigate({ to: '/play/$levelId', params: { levelId: '1' }, search: { challenge: undefined } })
  }

  useEffect(() => {
    if (!level) {
      setState(null)
      return
    }
    if (playId.current === levelId && !nebulaChallenge) return
    playId.current = levelId
    resetRun(createGame(level))
  }, [levelId, level, nebulaChallenge?.id])

  useEffect(() => {
    if (!state || state.status !== 'finale') return
    const t = window.setInterval(() => {
      setState((s) => (s ? reduce(s, { type: 'tick-finale' }) : s))
    }, 420)
    return () => window.clearInterval(t)
  }, [state?.status])

  useEffect(() => {
    if (!state || state.status !== 'playing' || clockPaused || boardBusy) return
    const t = window.setInterval(() => {
      setState((s) => (s && s.status === 'playing' ? reduce(s, { type: 'tick-clock' }) : s))
    }, 1000)
    return () => window.clearInterval(t)
  }, [state?.status, state?.levelId, clockPaused, boardBusy])

  useEffect(() => {
    setKitCounts(readKitCounts())
  }, [kitTick])

  useEffect(() => {
    if (!state || isLesson || noBoosters || nebulaBoostUsed.current) return
    if (state.status !== 'playing') return
    if (!consumeItem('nebula-boost')) return
    nebulaBoostUsed.current = true
    setKitTick((n) => n + 1)
    setState((s) => (s ? { ...s, movesLeft: s.movesLeft + 3, timeLeft: s.timeLeft + 12 } : s))
    setKitNote('Nebula booster: +3 moves, +12s')
    window.setTimeout(() => setKitNote(null), 2200)
  }, [state?.levelId, isLesson, noBoosters])

  useEffect(() => {
    if (!pickup) return
    const t = window.setTimeout(() => setPickup(null), 5500)
    return () => window.clearTimeout(t)
  }, [pickup?.key])

  useEffect(() => {
    if (!state) return
    if (state.cometTail > peakTail) setPeakTail(state.cometTail)
    for (const e of state.events) {
      if (e.type === 'invalid-swap') synth.invalid()
      if (e.type === 'swap') synth.swap()
      if (e.type === 'chocolate-spread') setSawSpread(true)
      if (e.type === 'special-combo') setSawSpecial(true)
      if (e.type === 'kit-drop') {
        setPickup({ key: Date.now(), item: e.item, index: e.index })
      }
      if (e.type === 'comet-tail' && e.decayed) {
        tailDeadline.current = null
        setCometRemainMs(0)
      }
      if (e.type === 'status' && e.status === 'won' && !awardedRef.current) {
        awardedRef.current = true
        synth.win()
        const run: ChallengeRun = {
          peakCometTail: Math.max(peakTail, state.cometTail),
          chocolateSpread: sawSpread,
          specialCombo: sawSpecial,
          hintUsed,
          timeLeft: state.timeLeft,
        }
        const cleared = challenges.filter((c) => evaluateChallenge(c, level!, run))
        let dust = cleared.reduce((n, c) => n + c.stardust, 0)
        let extraStars = Math.min(3, (state.score > 8000 ? 3 : state.score > 3000 ? 2 : 1) + (cleared.length ? 1 : 0))
        let nebulaOk = true
        if (nebulaChallenge) {
          nebulaOk = evaluateNebulaChallenge(nebulaChallenge, run)
          if (nebulaOk) {
            dust += nebulaChallenge.stardust
            extraStars = Math.min(3, Math.max(extraStars, nebulaChallenge.stars))
          }
        }
        if (!isLesson) {
          const nextBadge = recordWin(state.levelId, state.score, state.coinsEarned, {
            stars: extraStars,
            stardust: dust,
            challenges: cleared.map((c) => c.id),
            nebulaChallengeId: nebulaOk && nebulaChallenge ? nebulaChallenge.id : undefined,
            badge: nebulaOk ? nebulaChallenge?.badge : undefined,
          })
          if (nextBadge) setBadge(`BADGE ${nextBadge}`)
          void import('~/server/progress').then(({ submitScore, saveProgress }) => {
            void submitScore({ data: { levelId: state.levelId, score: state.score } }).catch(() => {})
            void saveProgress({
              data: { levelId: state.levelId, bestScore: state.score, stars: extraStars },
            }).catch(() => {})
          })
        } else {
          markTutorialComplete()
          setLessonIndex(LESSONS.length - 1)
        }
        if (!isLesson && (cleared[0] || (nebulaOk && nebulaChallenge))) {
          const bits = cleared.map((c) => challengeToast(c.id))
          if (nebulaOk && nebulaChallenge?.tier === 'high') bits.push(`${nebulaChallenge.title} sealed`)
          setToast(bits.join(' · '))
        }
      }
      if (e.type === 'status' && e.status === 'lost') synth.lose()
    }
  }, [state?.events])

  useEffect(() => {
    if (!state || state.status !== 'playing' || state.cometTail <= 0) {
      if (!state || state.cometTail <= 0) {
        tailDeadline.current = null
        setCometRemainMs(0)
      }
      return
    }
    const now = performance.now()
    if (boardBusy) {
      if (tailDeadline.current != null) {
        tailPause.current = Math.max(0, tailDeadline.current - now)
        tailDeadline.current = null
      }
      setCometRemainMs(tailPause.current || cometMs)
      return
    }
    if (tailDeadline.current == null) {
      const remaining = tailPause.current > 0 ? tailPause.current : cometMs
      tailDeadline.current = now + remaining
      tailPause.current = 0
    }
    const tick = () => {
      const deadline = tailDeadline.current
      if (deadline == null) return
      const left = Math.max(0, deadline - performance.now())
      setCometRemainMs(left)
      if (left <= 0) {
        tailDeadline.current = null
        if (consumeItem('comet-tail-shield') || consumeItem('ion-wake-shield')) {
          tailPause.current = cometMs
          tailDeadline.current = performance.now() + cometMs
          setCometRemainMs(cometMs)
          return
        }
        setState((s) => (s && s.cometTail > 0 ? reduce(s, { type: 'decay-comet-tail' }) : s))
      }
    }
    tick()
    const interval = window.setInterval(tick, 50)
    return () => window.clearInterval(interval)
  }, [state?.cometTail, state?.status, boardBusy, cometMs])

  useEffect(() => {
    if (!state) return
    if (state.cometTail > 0) {
      tailPause.current = cometMs
      if (!boardBusy) tailDeadline.current = performance.now() + cometMs
      setCometRemainMs(cometMs)
    }
  }, [state?.cometTail])

  if (guestBlocked) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-[13px] text-white/70">This orbit is locked. Sign in to continue the voyage.</p>
        <AuthPanel heading="First-play gate" />
      </div>
    )
  }
  if (!level) {
    return <p className="p-4">Unknown stage.</p>
  }
  if (!state) return <BoardSkeleton />

  const bumpKit = () => setKitTick((n) => n + 1)

  const tapBooster = (index: number) => {
    if (state.status !== 'playing' || noBoosters) return
    if (booster === 'hammer') {
      if (tutorialHammer > 0) setTutorialHammer(0)
      else if (!consumeItem('hammer')) {
        setBooster(null)
        return
      }
      bumpKit()
      setState((s) => (s ? reduce(s, { type: 'hammer', index }) : s))
      setBooster(null)
      if (lesson?.wait === 'booster') advanceLesson()
      return
    }
    if (booster === 'well') {
      if (!consumeItem('gravity-well')) {
        setBooster(null)
        return
      }
      bumpKit()
      setState((s) => (s ? reduce(s, { type: 'well', index }) : s))
      setBooster(null)
      return
    }
    if (booster === 'splash') {
      if (!isSwappable(state.cells[index]!)) {
        setDenyNote('Tap a live star to splash.')
        window.setTimeout(() => setDenyNote(null), 1600)
        return
      }
      if (!consumeItem('color-splash')) {
        setBooster(null)
        return
      }
      bumpKit()
      setState((s) => (s ? reduce(s, { type: 'color-splash', index }) : s))
      setBooster(null)
      return
    }
    if (booster === 'flare') {
      if (!isSwappable(state.cells[index]!)) {
        setDenyNote('Tap a live star to plant the flare.')
        window.setTimeout(() => setDenyNote(null), 1600)
        return
      }
      if (!consumeAny([...FLARE_ITEM_IDS])) {
        setBooster(null)
        return
      }
      bumpKit()
      setState((s) => {
        if (!s) return s
        const placed = reduce(s, { type: 'spawn-special', index, special: 'wrapped' })
        return reduce(placed, { type: 'ignite-special', index })
      })
      setBooster(null)
    }
  }

  const nextId = Math.min(250, id + 1)
  const nextOpen = canPlay(nextId)
  const lostEvent = state.events.find((e) => e.type === 'status' && e.status === 'lost')
  const loseReason =
    lostEvent && lostEvent.type === 'status' && lostEvent.reason ? lostEvent.reason : 'Orbit goal not cleared'

  return (
    <div className="relative space-y-3 px-3 pt-3">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => navigate({ to: '/' })} className="text-[12px] text-white/60">
          ← Map
        </button>
        <h1 className="display text-[22px] text-gold">{level.name}</h1>
        <span className="text-[11px] text-white/50">#{level.id}</span>
      </div>
      {nebulaChallenge ? (
        <p className="rounded-full border border-magenta/40 bg-magenta/10 px-3 py-1 text-center text-[11px] text-magenta">
          {nebulaChallenge.tier === 'high' ? `High risk · ${nebulaChallenge.title}` : nebulaChallenge.title}
          {nebulaChallenge.modifiers.cometTailMin ? ` · Tail x${nebulaChallenge.modifiers.cometTailMin}` : ''}
        </p>
      ) : null}
      <HUD
        state={state}
        level={level}
        onHint={() => {
          setHintUsed(true)
          hint.requestHint(state)
        }}
        hintBusy={hint.busy}
        coachLine={hint.coachLine}
        coachError={hint.coachError}
        cometRemainMs={cometRemainMs}
        cometDurationMs={cometMs}
        challenges={challenges}
        completedChallenges={typeof window === 'undefined' ? [] : completedChallenges(id)}
        lessonFocus={lesson?.focus === 'goal' || lesson?.focus === 'comet' || lesson?.focus === 'challenges' ? lesson.focus : null}
      />
      {lesson ? (
        <TutorialCoach
          step={lesson}
          index={lessonIndex}
          total={LESSONS.length}
          onNext={advanceLesson}
          onSkip={skipSchool}
        />
      ) : null}
      {denyNote ? <p className="text-center text-[12px] text-magenta">{denyNote}</p> : null}
      {kitNote ? <p className="text-center text-[12px] text-gold">{kitNote}</p> : null}
      <div className="relative">
        <Board
          state={state}
          hint={hint.hint}
          skin={skin}
          interaction={booster ? 'cell' : 'swap'}
          allowedPair={lesson?.pair ?? null}
          spotlight={lesson?.spotlight}
          onBusyChange={setBoardBusy}
          onDenied={(index, reason) => {
            synth.invalid()
            setDenyNote(
              reason === 'locked'
                ? 'Frosting, chocolate, and swirls stay put. Stars — even locked ones — can slide.'
                : 'Follow the glowing pair — the rest of the board waits.',
            )
            window.setTimeout(() => setDenyNote(null), 1800)
            void index
          }}
          onSwap={(a, b) => {
            if (state.status !== 'playing') return
            setState((s) => (s ? reduce(s, { type: 'swap', a, b }) : s))
            if (lesson?.wait === 'swap') advanceLesson()
            if (lesson?.wait === 'ignite' && (a === TUTORIAL_SUN || b === TUTORIAL_SUN)) advanceLesson()
          }}
          onIgnite={(index) => {
            if (state.status !== 'playing') return
            setState((s) => (s ? reduce(s, { type: 'ignite-special', index }) : s))
            if (lesson?.wait === 'ignite') advanceLesson()
          }}
          onCell={tapBooster}
          onWave={(wave) => {
            synth.pop(wave.combo)
            synth.explode(wave.blast)
            if (wave.word) synth.banner()
          }}
          pickup={pickup}
          onCollectPickup={() => {
            if (!pickup) return
            grantItem(pickup.item, 1)
            bumpKit()
            setKitNote(`${kitLabelForItem(pickup.item)} stowed in your kit`)
            setPickup(null)
            window.setTimeout(() => setKitNote(null), 1800)
          }}
        />
        <ChallengeToast text={toast} />
      </div>
      {noBoosters ? (
        <p className="text-center text-[11px] text-white/50">Naked sky — boosters sealed for this run</p>
      ) : (
        <BoosterTray
          armed={booster}
          disabled={state.status !== 'playing' || boardBusy}
          lesson={lesson?.focus === 'tray'}
          freeHammer={tutorialHammer > 0}
          counts={kitCounts}
          sector={level.sectorId}
          onArm={(id) => setBooster((cur) => (cur === id ? null : id))}
          onInstant={(id: InstantBooster) => {
            if (state.status !== 'playing' || boardBusy) return
            if (id === 'moves') {
              if (!consumeItem('moves-5')) return
              bumpKit()
              setState((s) => (s ? reduce(s, { type: 'add-moves', count: 5 }) : s))
              return
            }
            if (id === 'shuffle') {
              if (!consumeItem('star-shuffle')) return
              bumpKit()
              setState((s) => (s ? reduce(s, { type: 'shuffle' }) : s))
              return
            }
            if (id === 'shield') {
              if (!consumeAny(kitItemIds(slotById('shield')))) return
              bumpKit()
              setKitNote('Wake shield armed for the next fade')
              window.setTimeout(() => setKitNote(null), 1800)
              return
            }
            const deep = itemCount('orbit-time-deep') > 0
            const freeze = itemCount('freeze-orbit') > 0
            if (deep ? !consumeItem('orbit-time-deep') : freeze ? !consumeItem('freeze-orbit') : !consumeItem('orbit-time')) {
              return
            }
            bumpKit()
            const add = deep ? 35 : freeze ? 25 : 20
            setState((s) => (s ? { ...s, timeLeft: s.timeLeft + add } : s))
          }}
        />
      )}
      {badge ? (
        <p className="text-center text-[12px] text-gold">{badge}</p>
      ) : null}
      {state.status === 'won' ? (
        <div className="rounded-2xl border border-gold/40 bg-black/40 p-3 text-center">
          <p className="display text-[28px] text-gold">{isLesson ? 'Flight School clear' : 'Stage clear'}</p>
          {isLesson ? (
            <Link
              to="/play/$levelId"
              params={{ levelId: '1' }}
              search={{ challenge: undefined }}
              className="mt-2 inline-block text-magenta"
            >
              Enter Amber Veil 1-1 →
            </Link>
          ) : nextOpen ? (
            <Link
              to="/play/$levelId"
              params={{ levelId: String(nextId) }}
              search={{ challenge: undefined }}
              className="mt-2 inline-block text-magenta"
            >
              Next orbit →
            </Link>
          ) : (
            <Link to="/auth" className="mt-2 inline-block text-magenta">
              Sign in to continue →
            </Link>
          )}
        </div>
      ) : null}
      {state.status === 'lost' ? (
        <div className="rounded-2xl border border-red-400/40 bg-black/40 p-3 text-center">
          <p className="display text-[24px]">Drift failed</p>
          <p className="mt-1 text-[13px] text-white/70">{loseReason}</p>
          <p className="mt-2 text-[12px] text-white/55">
            Score and special challenges do not decide the stage. Challenges are optional shop bonuses.
          </p>
          <button type="button" className="mt-2 text-gold" onClick={() => resetRun(createGame(level))}>
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

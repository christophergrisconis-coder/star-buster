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
import { dailyLevel, shareOrbitHref, utcDayKey } from '~/data/daily'
import { weeklyLevel, currentWeekly, weekKey, WEEKLY_LEVEL_ID } from '~/data/weekly'
import { CONTINUE_MOVES, HINT_COIN_COST } from '~/data/gifts'
import { getLevel } from '~/data/levels'
import { CAMPAIGN, LEVEL_BY_ID } from '~/data/campaign'
import { createGame, howToClear, reduce } from '~/engine'
import { isSwappable, type GameState } from '~/engine/types'
import { ChallengeToast } from '~/fx/comboBanners'
import { RoundFinaleFX } from '~/fx/roundFinaleFX'
import { useHintCoach } from '~/hint/useHint'
import { Board } from '~/ui/Board'
import { FailSheet } from '~/ui/FailSheet'
import { HUD } from '~/ui/Hud'
import { BoosterTray, readKitCounts, type ArmedBooster, type InstantBooster } from '~/ui/BoosterTray'
import type { ActivePickup } from '~/ui/KitPickup'
import { BoardSkeleton } from '~/ui/skeletons'
import { AuthPanel } from '~/ui/AuthPanel'
import { NextOrbit } from '~/ui/NextOrbit'
import { TutorialCoach } from '~/ui/TutorialCoach'
import { synth } from '~/audio/synth'
import {
  bumpCometStreak,
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
  recordDailyScore,
  recordWin,
  spendCoins,
  spendLife,
} from '~/lib/progress'
import { kitItemIds, kitLabelForItem, slotById } from '~/data/kit'
import { applyTutorialBoard, LESSONS, TUTORIAL_LEVEL, TUTORIAL_SUN } from '~/data/tutorial'
import { hasCompletedTutorial, markTutorialComplete } from '~/lib/tutorial'

export const Route = createFileRoute('/play/$levelId')({
  validateSearch: (raw: Record<string, unknown>) => ({
    challenge: typeof raw.challenge === 'string' ? raw.challenge : undefined,
    seed: typeof raw.seed === 'string' ? Number(raw.seed) : typeof raw.seed === 'number' ? raw.seed : undefined,
  }),
  beforeLoad: ({ params }) => {
    if (typeof window === 'undefined') return
    if (params.levelId === 'tutorial' || params.levelId === 'daily' || params.levelId === 'weekly') return
    if (!hasCompletedTutorial() && params.levelId === '1') {
      throw redirect({ to: '/play/$levelId', params: { levelId: 'tutorial' }, search: { challenge: undefined, seed: undefined } })
    }
    const id = Number(params.levelId)
    if (!canPlay(id)) {
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
  const isDaily = levelId === 'daily'
  const isWeekly = levelId === 'weekly'
  const id = isLesson || isDaily || isWeekly ? 0 : Number(levelId)
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
    if (isDaily) return dailyLevel(utcDayKey(), Number.isFinite(search.seed) ? search.seed : undefined)
    const base = LEVEL_BY_ID[id] ?? getLevel(id)
    if (!base) return undefined
    return nebulaChallenge ? applyChallengeModifiers(base, nebulaChallenge) : base
  }, [id, nebulaChallenge, isLesson, isDaily, search.seed])
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
  const [hintCount, setHintCount] = useState(0)
  const [livesLeft, setLivesLeft] = useState(() => (typeof window === 'undefined' ? 5 : getInventory().lives))
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
  const [orbitJump, setOrbitJump] = useState(false)
  const nebulaBoostUsed = useRef(false)
  const shieldArmed = useRef(false)
  const awardedRef = useRef(false)
  const jumpedRef = useRef(false)
  const winClipSeen = useRef(false)
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
    setHintCount(0)
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
    setOrbitJump(false)
    nebulaBoostUsed.current = false
    shieldArmed.current = false
    jumpedRef.current = false
    winClipSeen.current = false
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
    void navigate({ to: '/play/$levelId', params: { levelId: '1' }, search: { challenge: undefined, seed: undefined } })
  }

  const jumpNextOrbit = () => {
    if (jumpedRef.current) return
    jumpedRef.current = true
    if (isLesson) {
      markTutorialComplete()
      void navigate({ to: '/play/$levelId', params: { levelId: '1' }, search: { challenge: undefined, seed: undefined } })
      return
    }
    if (isDaily) {
      void navigate({ to: '/leaderboard' })
      return
    }
    if (id >= 250) {
      void navigate({ to: '/' })
      return
    }
    const dest = Math.min(250, id + 1)
    const here = LEVEL_BY_ID[id]
    const next = LEVEL_BY_ID[dest]
    if (here && next && next.nebulaId !== here.nebulaId) {
      void navigate({ to: '/' })
      return
    }
    if (canPlay(dest)) {
      void navigate({ to: '/play/$levelId', params: { levelId: String(dest) }, search: { challenge: undefined, seed: undefined } })
      return
    }
    void navigate({ to: '/auth' })
  }
  const jumpNextOrbitRef = useRef(jumpNextOrbit)
  jumpNextOrbitRef.current = jumpNextOrbit

  useEffect(() => {
    if (state?.status !== 'won' && state?.status !== 'finale') {
      winClipSeen.current = false
      return
    }
    if (boardBusy) winClipSeen.current = true
  }, [state?.status, boardBusy])

  useEffect(() => {
    if (!state || state.status !== 'won' || boardBusy) return
    const pendingClip = state.events.some((e) => e.type === 'wave' || e.type === 'swap')
    if (pendingClip && !winClipSeen.current) return
    setOrbitJump(true)
    if (!isLesson && id >= 250) return
    const t = window.setTimeout(() => jumpNextOrbitRef.current(), 2800)
    return () => window.clearTimeout(t)
  }, [state?.status, state?.levelId, state?.events, boardBusy, isLesson, id])

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
    if (!state || state.status !== 'finale' || boardBusy) return
    const t = window.setTimeout(() => {
      setState((s) => (s && s.status === 'finale' ? reduce(s, { type: 'tick-finale' }) : s))
    }, 380)
    return () => window.clearTimeout(t)
  }, [state?.status, state?.events, boardBusy])

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


  const stowPickup = (item: string) => {
    grantItem(item, 1)
    setKitTick((n) => n + 1)
    setKitNote(`${kitLabelForItem(item)} loaded into your kit`)
    setPickup(null)
    window.setTimeout(() => setKitNote(null), 1800)
  }

  useEffect(() => {
    if (!pickup) return
    const t = window.setTimeout(() => stowPickup(pickup.item), 1200)
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
      if (
        e.type === 'wave' &&
        !nebulaBoostUsed.current &&
        !isLesson &&
        !noBoosters &&
        consumeItem('nebula-boost')
      ) {
        nebulaBoostUsed.current = true
        setKitTick((n) => n + 1)
        setState((s) => (s ? { ...s, movesLeft: s.movesLeft + 3, timeLeft: s.timeLeft + 12 } : s))
        setKitNote('Nebula booster: +3 moves, +12s')
        window.setTimeout(() => setKitNote(null), 2200)
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
          hintUsed: hintCount > 0,
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
        if (!isLesson && !isDaily) {
          bumpCometStreak(run.peakCometTail, true)
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
        } else if (isDaily) {
          recordDailyScore(utcDayKey(), state.score)
          void import('~/server/social').then(({ submitDailyScore }) => {
            void submitDailyScore({ data: { day: utcDayKey(), score: state.score } }).catch(() => {})
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
      if (e.type === 'status'
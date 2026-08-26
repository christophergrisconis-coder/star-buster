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

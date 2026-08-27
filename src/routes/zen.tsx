import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { createGame, reduce } from '~/engine'
import type { GameState, LevelConfig } from '~/engine/types'
import { Board } from '~/ui/Board'
import { synth } from '~/audio/synth'
import { grantStardust } from '~/lib/progress'

const ZEN_BEST_KEY = 'star-buster-zen-best'

function readZenBest(): number {
  if (typeof window === 'undefined') return 0
  try {
    return Number(localStorage.getItem(ZEN_BEST_KEY)) || 0
  } catch {
    return 0
  }
}

const ZEN_LEVEL_CONFIG: LevelConfig = {
  id: 9999,
  seed: 42,
  name: 'Zen Orbit',
  sectorId: 1,
  systemId: 'zen',
  nebulaId: 'zen',
  stageId: 'zen',
  moves: 99999,
  colorCount: 5,
  rewardCap: 99999,
  timeLimit: 999999,
  objective: {
    type: 'order',
    orders: [
      { color: 'gold', count: 9999 },
    ],
  },
  frosting: [],
  marmalade: [],
  locks: [],
  swirls: [],
  chocolate: [],
  bombs: [],
  jelly: [],
  ingredients: [],
  exits: [],
}

export const Route = createFileRoute('/zen')({
  component: ZenOrbitPage,
})

function ZenOrbitPage() {
  const [state, setState] = useState<GameState>(() => createGame(ZEN_LEVEL_CONFIG))
  const [earnedStardust, setEarnedStardust] = useState(0)
  const [lastMilestone, setLastMilestone] = useState(0)
  const [showMilestoneToast, setShowMilestoneToast] = useState(false)
  const [best, setBest] = useState(readZenBest)
  const [newBest, setNewBest] = useState(false)

  // Start ambient audio on mount
  useEffect(() => {
    synth.startBgm()
    return () => {
      synth.stopBgm()
    }
  }, [])

  // Track the personal best zen score on this device.
  useEffect(() => {
    if (state.score > best) {
      setBest(state.score)
      setNewBest(best > 0)
      try {
        localStorage.setItem(ZEN_BEST_KEY, String(state.score))
      } catch {
        /* storage unavailable */
      }
    }
  }, [state.score, best])

  // Check Stardust milestone payouts every 5,000 score
  useEffect(() => {
    const currentMilestone = Math.floor(state.score / 5000)
    if (currentMilestone > lastMilestone) {
      const added = (currentMilestone - lastMilestone) * 5
      setEarnedStardust((prev) => prev + added)
      setLastMilestone(currentMilestone)
      grantStardust(added)

      synth.fanfare()
      setShowMilestoneToast(true)
      const t = setTimeout(() => setShowMilestoneToast(false), 2500)
      return () => clearTimeout(t)
    }
  }, [state.score, lastMilestone])

  const handleSwap = (a: number, b: number) => {
    const nextState = reduce(state, { type: 'swap', a, b })
    setState(nextState)
  }

  const handleReshuffle = () => {
    synth.whoosh()
    setState(createGame(ZEN_LEVEL_CONFIG))
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between px-2 pt-3 pb-8 text-white">
      {/* Header HUD */}
      <div className="w-full max-w-md space-y-2">
        <div className="flex items-center justify-between px-2">
          <Link to="/" className="text-[13px] text-white/60 hover:text-white flex items-center gap-1">
            ← Voyage
          </Link>
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 font-bold">ENDLESS MODE</span>
            <h1 className="display text-[22px] text-cyan-100">Zen Space Orbit</h1>
          </div>
          <button
            type="button"
            onClick={handleReshuffle}
            title="Reshuffle Star Field"
            className="rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] text-cyan-200 hover:bg-white/10"
          >
            ↻ Shuffle
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-cyan-500/20 bg-cyan-950/20 px-4 py-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Zen Score</div>
            <div className="display text-[22px] text-gold">{state.score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Best</div>
            <div className={`display text-[22px] ${newBest ? 'text-gold' : 'text-white/80'}`}>
              {best.toLocaleString()}
              {newBest ? ' ★' : ''}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Harvested</div>
            <div className="display text-[22px] text-cyan-300">✨ +{earnedStardust}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Next Drop</div>
            <div className="text-[13px] font-bold text-white/80">
              {5000 - (state.score % 5000)} pts
            </div>
          </div>
        </div>
      </div>

      {/* Milestone Toast */}
      {showMilestoneToast && (
        <div className="fixed top-20 z-50 animate-bounce rounded-full border border-cyan-400/50 bg-void/90 px-6 py-2 text-[14px] font-bold text-cyan-200 shadow-[0_0_30px_#5ce1ff88]">
          ✨ Milestone Reached! +5 Cosmic Stardust
        </div>
      )}

      {/* Match-3 Board */}
      <div className="my-auto w-full max-w-md">
        <Board
          state={state}
          onSwap={handleSwap}
        />
      </div>

      <div className="text-center text-[12px] text-white/40">
        No timers • Infinite moves • Relax and align cosmic gems
      </div>
    </div>
  )
}

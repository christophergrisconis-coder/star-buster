import { describeObjective } from '~/engine/objectives'
import type { GameState } from '~/engine/types'

export function HUD({
  state,
  onHint,
  hintBusy,
  coachLine,
  coachError,
}: {
  state: GameState
  onHint: () => void
  hintBusy: boolean
  coachLine: string | null
  coachError: string | null
}) {
  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="display text-[24px] leading-none text-gold">{state.score}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/50">score</div>
        </div>
        <div className="rounded-full border border-magenta/40 bg-void/60 px-3 py-1 text-center">
          <div className="display text-[22px] text-magenta">{state.movesLeft}</div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">moves</div>
        </div>
        <div className="text-right">
          <div className="text-[12px] text-gold">★ {state.coinsEarned}</div>
          <div className="text-[11px] text-white/50">cap {state.rewardCap}</div>
        </div>
      </div>
      <p className="text-[13px] text-white/80">{describeObjective(state.objective)}</p>
      <button
        type="button"
        onClick={onHint}
        disabled={hintBusy || state.status !== 'playing'}
        className="w-full rounded-full bg-magenta/90 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
      >
        {hintBusy ? 'Scanning orbits…' : 'AI Hint Coach'}
      </button>
      {coachLine ? <p className="text-[13px] italic text-gold/90">“{coachLine}”</p> : null}
      {coachError ? <p className="text-[12px] text-red-300">Coach offline: {coachError}</p> : null}
    </div>
  )
}

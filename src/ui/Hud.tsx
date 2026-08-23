import type { Challenge } from '~/data/challenges'
import { describeObjective, howToClear } from '~/engine/objectives'
import type { GameState, LevelConfig } from '~/engine/types'

function formatClock(seconds: number): string {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function goalProgress(state: GameState, level: LevelConfig): { left: number; total: number; label: string } {
  const label = describeObjective(state.objective)
  if (state.objective.type === 'jelly') {
    const total = level.jelly.reduce((n, v) => n + v, 0) || state.objective.remaining
    return { left: state.objective.remaining, total, label }
  }
  if (state.objective.type === 'ingredient') {
    const total = level.ingredients.length || state.objective.remaining
    return { left: state.objective.remaining, total, label }
  }
  const total = level.objective.type === 'order' ? level.objective.orders.reduce((n, o) => n + o.count, 0) : 1
  const left = state.objective.orders.reduce((n, o) => n + o.count, 0)
  return { left, total: Math.max(total, 1), label }
}

export function HUD({
  state,
  level,
  onHint,
  hintBusy,
  coachLine,
  coachError,
  cometRemainMs,
  cometDurationMs,
  challenges,
  completedChallenges = [],
  lessonFocus,
}: {
  state: GameState
  level: LevelConfig
  onHint: () => void
  hintBusy: boolean
  coachLine: string | null
  coachError: string | null
  cometRemainMs: number
  cometDurationMs: number
  challenges: Challenge[]
  completedChallenges?: string[]
  lessonFocus?: 'goal' | 'comet' | 'challenges' | null
}) {
  const tail = state.cometTail
  const frac = tail <= 0 || cometDurationMs <= 0 ? 0 : Math.max(0, Math.min(1, cometRemainMs / cometDurationMs))
  const clockUrgent = state.timeLeft <= 15
  const done = new Set(completedChallenges)
  const goal = goalProgress(state, level)
  const cleared = Math.max(0, goal.total - goal.left)
  const goalPct = goal.total <= 0 ? 0 : Math.round((cleared / goal.total) * 100)

  return (
    <div className="space-y-2 px-1">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="display text-[24px] leading-none text-gold">{state.score}</div>
          <div className="text-[11px] uppercase tracking-widest text-white/50">score</div>
        </div>
        <div
          className={`rounded-full border px-3 py-1 text-center ${
            clockUrgent ? 'border-red-400/70 bg-red-950/50' : 'border-cyan-400/40 bg-void/60'
          }`}
        >
          <div className={`display text-[22px] ${clockUrgent ? 'text-red-300' : 'text-cyan-200'}`}>
            {formatClock(state.timeLeft)}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/50">orbit clock</div>
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

      <section className={`goal-card goal-card--hero ${lessonFocus === 'goal' ? 'lesson-focus' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <p className="goal-kicker">Orbit challenge · required</p>
          <span className="text-[12px] font-semibold text-gold">
            {goal.left <= 0 ? 'Clear!' : `${goal.left} left`}
          </span>
        </div>
        <h2 className="display mt-1 text-[22px] leading-tight text-gold">{goal.label}</h2>
        <p className="mt-1 text-[13px] text-cyan-100/90">{howToClear(state.objective)}</p>
        <div className="voyage-meter-track mt-2" aria-hidden>
          <div className="voyage-meter-fill" style={{ width: `${Math.max(6, goalPct)}%` }} />
        </div>
      </section>

      <div className={`comet-meter ${lessonFocus === 'comet' ? 'lesson-focus' : ''}`}>
        <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-widest">
          <span className="text-[#ffd24a]">Comet Tail {tail > 0 ? `x${tail}` : '—'}</span>
          <span className="text-white/45">{tail > 0 ? `${(cometRemainMs / 1000).toFixed(1)}s` : 'awaiting chain'}</span>
        </div>
        <div className="comet-meter-track" aria-hidden>
          <div className="comet-meter-fill" style={{ width: `${frac * 100}%` }} />
        </div>
      </div>

      {challenges.length ? (
        <section className={`challenge-outline ${lessonFocus === 'challenges' ? 'lesson-focus' : ''}`}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-gold">Optional shop bonuses</p>
          <p className="mt-1 text-[11px] text-white/50">Skip these and still advance. Seal them for extra coins and stardust.</p>
          <ul className="mt-2 space-y-1.5">
            {challenges.map((c) => (
              <li
                key={c.id}
                className={`challenge-row ${done.has(c.id) ? 'challenge-row--done' : ''}`}
              >
                <span className="challenge-tick" aria-hidden>
                  {done.has(c.id) ? '★' : '○'}
                </span>
                <span>
                  <span className="block text-[12px] text-gold">{c.title}</span>
                  <span className="block text-[11px] text-white/60">{c.blurb}</span>
                </span>
                <span className="text-[10px] text-cyan-200">+{c.stardust}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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

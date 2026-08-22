import { BlazingSun } from './StarTile'
import type { LessonStep } from '~/data/tutorial'

export function TutorialCoach({
  step,
  index,
  total,
  onNext,
  onSkip,
}: {
  step: LessonStep
  index: number
  total: number
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="tutorial-stage">
      <div className="tutorial-scene">
        <div className="tutorial-mascot" aria-hidden>
          <BlazingSun id="coach-sun" special="none" />
        </div>
        <div className="tutorial-bubble">
          <p className="text-[10px] uppercase tracking-[0.22em] text-magenta">
            Flight School · {index + 1}/{total}
          </p>
          <h2 className="display mt-1 text-[22px] text-gold">{step.title}</h2>
          <p className="mt-2 text-[13px] leading-snug text-white/80">{step.body}</p>
          <div className="mt-3 flex items-center gap-2">
            {step.wait === 'next' ? (
              <button type="button" className="play-cta rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-widest text-void" onClick={onNext}>
                Next
              </button>
            ) : (
              <p className="text-[11px] uppercase tracking-widest text-gold">
                {step.wait === 'swap'
                  ? 'Waiting on your swipe…'
                  : step.wait === 'ignite'
                    ? 'Waiting on that solar flare…'
                    : step.wait === 'booster'
                      ? 'Arm the Meteor, then tap a star…'
                      : 'Clear the orbit goal to graduate…'}
              </p>
            )}
            <button type="button" className="text-[11px] text-white/45" onClick={onSkip}>
              Skip school
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

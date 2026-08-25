import { LIFE_MAX } from '~/data/gifts'

export function LivesPips({ lives, compact }: { lives: number; compact?: boolean }) {
  return (
    <span className={`lives-pips ${compact ? 'lives-pips--compact' : ''}`} title={`${lives} / ${LIFE_MAX} pulses`}>
      {Array.from({ length: LIFE_MAX }, (_, i) => (
        <span key={i} className={`life-pip ${i < lives ? 'life-pip--on' : ''}`} />
      ))}
    </span>
  )
}

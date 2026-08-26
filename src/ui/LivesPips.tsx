import { getMaxLives } from '~/data/gifts'

export function LivesPips({ lives, compact }: { lives: number; compact?: boolean }) {
  const max = typeof window === 'undefined' ? 5 : getMaxLives()
  return (
    <span className={`lives-pips ${compact ? 'lives-pips--compact' : ''}`} title={`${lives} / ${max} pulses`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`life-pip ${i < lives ? 'life-pip--on' : ''}`} />
      ))}
    </span>
  )
}

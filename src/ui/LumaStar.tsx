import type { StarColor } from '~/engine/types'

const HUE: Record<StarColor, string> = {
  gold: 'hue-rotate(0deg) saturate(1.05)',
  red: 'hue-rotate(-42deg) saturate(1.45)',
  green: 'hue-rotate(88deg) saturate(1.25)',
  blue: 'hue-rotate(188deg) saturate(1.2)',
  purple: 'hue-rotate(248deg) saturate(1.3)',
  cyan: 'hue-rotate(158deg) saturate(1.2)',
}

export function LumaStar({
  color,
  special,
}: {
  color: StarColor | null
  special: string
}) {
  const hue = color ? HUE[color] : HUE.gold
  const power = special !== 'none'
  return (
    <div className="luma-wrap">
      <img
        src="/stars/luma.png"
        alt=""
        draggable={false}
        className={`luma-sprite${power ? ' luma-sprite--power' : ''}`}
        style={{ filter: `${hue} drop-shadow(0 0 7px var(--star-glow, #ffd24a))` }}
      />
    </div>
  )
}

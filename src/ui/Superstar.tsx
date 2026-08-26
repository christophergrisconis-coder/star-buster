import type { StarColor } from '~/engine/types'
import { BlazingSun, NovaBomb, SharpStar } from './StarTile'

const FILLS: Record<StarColor, { a: string; b: string; c: string; glow: string; brow: string }> = {
  gold: { a: '#fff8d0', b: '#ffd24a', c: '#c2410c', glow: '#ffd24a', brow: '#7a2e09' },
  red: { a: '#ffd0d0', b: '#ff4b4b', c: '#7f1d1d', glow: '#ff4b4b', brow: '#3b0a0a' },
  green: { a: '#d4ffe4', b: '#3dff8a', c: '#14532d', glow: '#3dff8a', brow: '#0b2a16' },
  blue: { a: '#dbe8ff', b: '#4da3ff', c: '#1e3a8a', glow: '#4da3ff', brow: '#0b1d44' },
  purple: { a: '#f0e0ff', b: '#c084fc', c: '#6b21a8', glow: '#c084fc', brow: '#2e0a4a' },
  cyan: { a: '#d9fbff', b: '#22d3ee', c: '#155e75', glow: '#22d3ee', brow: '#083344' },
}

export function SuperstarSvg({
  color,
  special = 'none',
  size = 40,
}: {
  color: StarColor | null
  special?: string
  size?: number
}) {
  const id = `hud-${color ?? 'x'}-${special}-${size}`.replace(/[^a-z0-9-]/gi, '')
  const spec = special as
    | 'none'
    | 'striped-h'
    | 'striped-v'
    | 'wrapped'
    | 'color-bomb'
    | 'starfish'
  const fill = color ? FILLS[color] : FILLS.gold
  return (
    <span className="star-idle relative inline-block" style={{ width: size, height: size }}>
      {spec === 'color-bomb' ? (
        <NovaBomb id={id} />
      ) : color === 'gold' ? (
        <BlazingSun id={id} special={spec} />
      ) : (
        <div className="star-3d h-full w-full">
          <SharpStar id={id} fill={fill} special={spec} color={color} />
        </div>
      )}
    </span>
  )
}

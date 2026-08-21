import type { StarColor } from '~/engine/types'

const FILLS: Record<StarColor, string> = {
  gold: '#ffd24a',
  red: '#ff4d4d',
  green: '#5dff7a',
  blue: '#4d8dff',
  purple: '#c45dff',
  cyan: '#5ce1ff',
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
  const fill = color ? FILLS[color] : '#ffe9a8'
  const id = `${color}-${special}-${size}`
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)]">
      <defs>
        <radialGradient id={`g-${id}`} cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff6d8" />
          <stop offset="55%" stopColor={fill} />
          <stop offset="100%" stopColor="#3a1408" />
        </radialGradient>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polygon
        filter={`url(#glow-${id})`}
        fill={`url(#g-${id})`}
        stroke={special === 'color-bomb' ? '#fff' : '#fff8'}
        strokeWidth="1.4"
        points="32,4 39,24 60,24 43,36 50,56 32,44 14,56 21,36 4,24 25,24"
      />
      <ellipse cx="26" cy="22" rx="6" ry="3.2" fill="#fff" opacity="0.55" />
      {special === 'striped-h' || special === 'striped-v' ? (
        <path
          d={special === 'striped-h' ? 'M10 32 H54' : 'M32 8 V56'}
          stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.85"
        />
      ) : null}
      {special === 'wrapped' ? (
        <circle cx="32" cy="32" r="10" fill="none" stroke="#fff" strokeWidth="2.2" />
      ) : null}
      {special === 'color-bomb' ? (
        <circle cx="32" cy="32" r="7" fill="#1a1028" stroke="#ffd24a" strokeWidth="2" />
      ) : null}
    </svg>
  )
}

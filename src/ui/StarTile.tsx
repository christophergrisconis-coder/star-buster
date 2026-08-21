import type { Cell, StarColor } from '~/engine/types'

const FILLS: Record<StarColor, { a: string; b: string; glow: string }> = {
  gold: { a: '#fff3a8', b: '#e0a000', glow: '#ffd24a' },
  red: { a: '#ffb3b3', b: '#d01818', glow: '#ff4b4b' },
  green: { a: '#b8ffd2', b: '#0f9f4a', glow: '#3dff8a' },
  blue: { a: '#c4ddff', b: '#1b5fd0', glow: '#4da3ff' },
  purple: { a: '#ead5ff', b: '#7a2ad8', glow: '#c084fc' },
  cyan: { a: '#c6fbff', b: '#0891b2', glow: '#22d3ee' },
}

function StarPath() {
  return (
    <path d="M32 4 L39.4 22.4 L59 23.2 L43.6 35.6 L49.2 54.8 L32 44.4 L14.8 54.8 L20.4 35.6 L5 23.2 L24.6 22.4 Z" />
  )
}

export function StarTile({
  cell,
  selected,
  exploding,
  spawning,
  delay,
  skin,
}: {
  cell: Cell
  selected?: boolean
  exploding?: boolean
  spawning?: boolean
  delay?: number
  skin?: string
}) {
  const fill = cell.color ? FILLS[cell.color] : { a: '#fff', b: '#888', glow: '#fff' }
  const cls = exploding ? 'star-explode' : spawning ? 'star-spawn' : 'star-idle'

  return (
    <div
      className={`relative h-full w-full ${selected ? 'brightness-125' : ''}`}
      style={{ transform: 'translate3d(0,0,0)' }}
    >
      {cell.jelly > 0 ? (
        <div className="absolute inset-1 rounded-md bg-[#5ce1ff]/25 ring-1 ring-[#5ce1ff]/50" />
      ) : null}

      {cell.frosting > 0 ? (
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-white/80 to-sky-300/50 ring-2 ring-white/70">
          <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-sky-900">
            {cell.frosting}
          </span>
        </div>
      ) : null}

      {cell.chocolate ? (
        <div className="absolute inset-1 rounded-md bg-gradient-to-br from-[#5a3418] to-[#1a0c06] shadow-inner" />
      ) : null}

      {cell.swirl ? (
        <div className="absolute inset-1 rounded-full border-4 border-dashed border-[#3b2a22] bg-[#1a120c]" />
      ) : null}

      {cell.ingredient ? (
        <div className="absolute inset-1 grid place-items-center">
          <div
            className="h-6 w-6 rotate-12 rounded-sm bg-gradient-to-br from-[#ff8a4c] to-[#7a1d1d]"
            style={{ clipPath: 'polygon(50% 0, 100% 40%, 80% 100%, 20% 100%, 0 40%)' }}
          />
        </div>
      ) : null}

      {(cell.color || cell.special === 'color-bomb') && !cell.frosting && !cell.chocolate && !cell.swirl && !cell.ingredient ? (
        <svg
          viewBox="0 0 64 64"
          className={`h-full w-full ${cls}`}
          style={{
            animationDelay: `${delay ?? 0}ms`,
            filter: `drop-shadow(0 0 6px ${fill.glow}) ${skin === 'aurora' ? 'hue-rotate(28deg)' : ''} ${skin === 'void' ? 'saturate(1.4)' : ''}`,
          }}
        >
          <defs>
            <radialGradient id={`g-${cell.color ?? 'nova'}`} cx="35%" cy="30%">
              <stop offset="0%" stopColor={fill.a} />
              <stop offset="100%" stopColor={fill.b} />
            </radialGradient>
          </defs>
          <g fill={`url(#g-${cell.color ?? 'nova'})`} stroke="#fff8" strokeWidth="1.2">
            <StarPath />
          </g>
          {cell.special === 'striped-h' || cell.special === 'striped-v' ? (
            <g
              stroke="#fff"
              strokeWidth="3"
              opacity="0.7"
              transform={cell.special === 'striped-v' ? 'rotate(90 32 32)' : undefined}
            >
              <line x1="12" y1="24" x2="52" y2="24" />
              <line x1="12" y1="32" x2="52" y2="32" />
              <line x1="12" y1="40" x2="52" y2="40" />
            </g>
          ) : null}
          {cell.special === 'wrapped' ? (
            <circle cx="32" cy="32" r="22" fill="none" stroke="#ff2bd6" strokeWidth="3" />
          ) : null}
          {cell.special === 'color-bomb' ? (
            <circle cx="32" cy="32" r="10" fill="#111" stroke="#ffd24a" strokeWidth="3" />
          ) : null}
          {cell.special === 'starfish' ? (
            <circle cx="32" cy="32" r="6" fill="#fff" />
          ) : null}
        </svg>
      ) : null}

      {cell.marmalade ? (
        <div className="absolute inset-0 rounded-md bg-[#ffb703]/45 mix-blend-multiply" />
      ) : null}
      {cell.lock ? (
        <div className="absolute inset-1 rounded-sm border-2 border-[#c9a227] bg-black/20" />
      ) : null}
      {cell.bomb > 0 ? (
        <span className="absolute right-0 top-0 rounded-full bg-red-600 px-1 text-[9px] font-bold">
          {cell.bomb}
        </span>
      ) : null}
    </div>
  )
}

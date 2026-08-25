import { useId } from 'react'
import { SKIN_FILTERS } from '~/data/store'
import type { Cell, StarColor } from '~/engine/types'
import { STAR5, sunRayPath } from './starGeometry'

const FILLS: Record<StarColor, { a: string; b: string; c: string; glow: string; brow: string }> = {
  gold: { a: '#fff8d0', b: '#ffd24a', c: '#c2410c', glow: '#ffd24a', brow: '#7a2e09' },
  red: { a: '#ffd0d0', b: '#ff4b4b', c: '#7f1d1d', glow: '#ff4b4b', brow: '#3b0a0a' },
  green: { a: '#d4ffe4', b: '#3dff8a', c: '#14532d', glow: '#3dff8a', brow: '#0b2a16' },
  blue: { a: '#dbe8ff', b: '#4da3ff', c: '#1e3a8a', glow: '#4da3ff', brow: '#0b1d44' },
  purple: { a: '#f0e0ff', b: '#c084fc', c: '#6b21a8', glow: '#c084fc', brow: '#2e0a4a' },
  cyan: { a: '#d9fbff', b: '#22d3ee', c: '#155e75', glow: '#22d3ee', brow: '#083344' },
}

const INGREDIENT_FILL = { a: '#ffe0c2', b: '#ff8a4c', c: '#7a1d1d', glow: '#ff8a4c', brow: '#4a1208' }

type FaceKind = 'star' | 'sun' | 'nova'

/** Original cartoon face — big eyes, highlights, brows, smile. */
export function StarFace({ kind, brow }: { kind: FaceKind; brow: string }) {
  if (kind === 'sun') {
    return (
      <g className="star-face">
        <g className="star-eyes">
          <path
            d="M20.8 24.2 Q25.8 21.2 30.4 24.4"
            fill="none"
            stroke={brow}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M33.6 24.4 Q38.2 21.2 43.2 24.2"
            fill="none"
            stroke={brow}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <ellipse cx="25.8" cy="29.6" rx="5.8" ry="6.6" fill="#fffef6" stroke={brow} strokeWidth="0.85" />
          <ellipse cx="38.2" cy="29.6" rx="5.8" ry="6.6" fill="#fffef6" stroke={brow} strokeWidth="0.85" />
          <ellipse cx="26.5" cy="30.6" rx="3.25" ry="3.55" fill="#2a1208" />
          <ellipse cx="38.9" cy="30.6" rx="3.25" ry="3.55" fill="#2a1208" />
          <circle cx="24.7" cy="28.1" r="1.45" fill="#fff" />
          <circle cx="37.1" cy="28.1" r="1.45" fill="#fff" />
          <circle cx="27.6" cy="32.2" r="0.55" fill="#fff" opacity="0.7" />
          <circle cx="40" cy="32.2" r="0.55" fill="#fff" opacity="0.7" />
        </g>
        <path
          d="M24.8 37.6 Q32 44.2 39.2 37.6"
          fill="none"
          stroke={brow}
          strokeWidth="2.15"
          strokeLinecap="round"
        />
        <circle cx="22.4" cy="35.2" r="1.7" fill="#ff7a59" opacity="0.5" />
        <circle cx="41.6" cy="35.2" r="1.7" fill="#ff7a59" opacity="0.5" />
      </g>
    )
  }

  if (kind === 'nova') {
    return (
      <g className="star-face">
        <g className="star-eyes">
          <path
            d="M20.5 22.5 Q25.8 19.8 30.2 22.8"
            fill="none"
            stroke="#ffd24a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M33.8 22.8 Q38.2 19.8 43.5 22.5"
            fill="none"
            stroke="#ffd24a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <ellipse cx="25.6" cy="28.2" rx="6.1" ry="7" fill="#f7e9ff" stroke="#ffd24a" strokeWidth="0.9" />
          <ellipse cx="38.4" cy="28.2" rx="6.1" ry="7" fill="#f7e9ff" stroke="#ffd24a" strokeWidth="0.9" />
          <ellipse cx="26.3" cy="29.2" rx="3.4" ry="3.8" fill="#1a0828" />
          <ellipse cx="39.1" cy="29.2" rx="3.4" ry="3.8" fill="#1a0828" />
          <circle cx="24.4" cy="26.6" r="1.5" fill="#fff" />
          <circle cx="37.2" cy="26.6" r="1.5" fill="#fff" />
        </g>
        <path
          d="M24.2 36.4 Q32 42.6 39.8 36.4"
          fill="none"
          stroke="#ffd24a"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
      </g>
    )
  }

  return (
    <g className="star-face">
      <g className="star-eyes">
        <path
          d="M19.6 21.6 Q25.6 18.4 30.6 21.8"
          fill="none"
          stroke={brow}
          strokeWidth="2.05"
          strokeLinecap="round"
        />
        <path
          d="M33.4 21.8 Q38.4 18.4 44.4 21.6"
          fill="none"
          stroke={brow}
          strokeWidth="2.05"
          strokeLinecap="round"
        />
        <ellipse cx="25.4" cy="27.8" rx="6.6" ry="7.6" fill="#fffef6" stroke={brow} strokeWidth="0.95" />
        <ellipse cx="38.6" cy="27.8" rx="6.6" ry="7.6" fill="#fffef6" stroke={brow} strokeWidth="0.95" />
        <ellipse cx="26.2" cy="28.9" rx="3.55" ry="4.05" fill="#1a0c08" />
        <ellipse cx="39.4" cy="28.9" rx="3.55" ry="4.05" fill="#1a0c08" />
        <circle cx="24.1" cy="25.9" r="1.7" fill="#fff" />
        <circle cx="37.3" cy="25.9" r="1.7" fill="#fff" />
        <circle cx="27.5" cy="30.6" r="0.6" fill="#fff" opacity="0.75" />
        <circle cx="40.7" cy="30.6" r="0.6" fill="#fff" opacity="0.75" />
      </g>
      <path
        d="M24.0 36.2 Q32 43.4 40.0 36.2"
        fill="none"
        stroke={brow}
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="21.6" cy="34.4" r="1.85" fill="#ff7a59" opacity="0.45" />
      <circle cx="42.4" cy="34.4" r="1.85" fill="#ff7a59" opacity="0.45" />
    </g>
  )
}

function SpecialMarks({ special }: { special: Cell['special'] }) {
  if (special === 'none') return null

  if (special === 'striped-h') {
    return (
      <>
        <line x1="8" y1="32" x2="56" y2="32" stroke="#fff" strokeWidth="3" opacity="0.9" strokeLinecap="round" />
        <line x1="10" y1="28" x2="54" y2="28" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <line x1="10" y1="36" x2="54" y2="36" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      </>
    )
  }

  if (special === 'striped-v') {
    return (
      <>
        <line x1="32" y1="8" x2="32" y2="56" stroke="#fff" strokeWidth="3" opacity="0.9" strokeLinecap="round" />
        <line x1="28" y1="10" x2="28" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <line x1="36" y1="10" x2="36" y2="54" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      </>
    )
  }

  if (special === 'color-bomb') {
    return (
      <>
        <circle cx="32" cy="32" r="20" fill="none" stroke="#ffd24a" strokeWidth="2" opacity="0.85" strokeDasharray="4 3" />
        <circle cx="32" cy="32" r="16" fill="none" stroke="#c084fc" strokeWidth="1.5" opacity="0.65" strokeDasharray="3 4" />
        <circle cx="32" cy="32" r="12" fill="none" stroke="#22d3ee" strokeWidth="1.2" opacity="0.55" strokeDasharray="2 4" />
      </>
    )
  }

  return (
    <>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#ff2bd6" strokeWidth="2.4" opacity="0.95" />
      <circle cx="32" cy="32" r="17.5" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.55" />
    </>
  )
}

function SunCore({
  id,
  fill,
  special,
  powerPlay,
}: {
  id: string
  fill: { a: string; b: string; c: string; glow: string; brow: string }
  special: Cell['special']
  powerPlay: boolean
}) {
  const g = `sun-body-${id}`
  const corona = `sun-corona-${id}`
  const rays = `sun-rays-${id}`
  return (
    <div className={`sun-3d ${powerPlay ? 'sun-power' : ''}`}>
      <div className="sun-flare-spin pointer-events-none absolute inset-[-6%]">
        <div className="sun-flare-pulse h-full w-full">
          <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
            <defs>
              <radialGradient id={rays} cx="50%" cy="50%">
                <stop offset="0%" stopColor={fill.a} />
                <stop offset="55%" stopColor={fill.b} />
                <stop offset="100%" stopColor={fill.c} />
              </radialGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill={fill.glow} opacity="0.22" />
            <path d={sunRayPath(18, 15.2)} fill={`url(#${rays})`} opacity="0.96" />
          </svg>
        </div>
      </div>
      <svg viewBox="0 0 64 64" className="star-art relative h-full w-full overflow-visible">
        <defs>
          <radialGradient id={g} cx="34%" cy="30%">
            <stop offset="0%" stopColor="#fffce8" />
            <stop offset="22%" stopColor={fill.a} />
            <stop offset="58%" stopColor={fill.b} />
            <stop offset="100%" stopColor={fill.c} />
          </radialGradient>
          <radialGradient id={corona} cx="50%" cy="50%">
            <stop offset="40%" stopColor={fill.glow} stopOpacity="0.55" />
            <stop offset="100%" stopColor={fill.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="24" fill={`url(#${corona})`} />
        <circle cx="32" cy="32" r="17.4" fill={fill.glow} opacity="0.38" />
        <circle cx="32" cy="32" r="15.6" fill={fill.b} stroke="#fff8e8" strokeWidth="1.25" />
        <circle cx="32" cy="32" r="15.6" fill={`url(#${g})`} />
        {powerPlay ? (
          <circle cx="32" cy="32" r="18.6" fill="none" stroke="#ffd24a" strokeWidth="1.4" opacity="0.85" />
        ) : null}
        <SpecialMarks special={special} />
        <StarFace kind="sun" brow={fill.brow} />
      </svg>
    </div>
  )
}

export function BlazingSun({ id, special }: { id: string; special: Cell['special'] }) {
  return <SunCore id={id} fill={FILLS.gold} special={special} powerPlay={special !== 'none'} />
}

export function SharpStar({
  id,
  fill,
  special,
}: {
  id: string
  fill: { a: string; b: string; c: string; glow: string; brow: string }
  special: Cell['special']
}) {
  const g = `sg-${id}`
  const glow = `sglow-${id}`
  return (
    <svg viewBox="0 0 64 64" className="star-art relative h-full w-full overflow-visible">
      <defs>
        <radialGradient id={g} cx="34%" cy="28%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="32%" stopColor={fill.a} />
          <stop offset="70%" stopColor={fill.b} />
          <stop offset="100%" stopColor={fill.c} />
        </radialGradient>
        <filter id={glow} x="-18%" y="-18%" width="136%" height="136%">
          <feGaussianBlur stdDeviation="1.05" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={STAR5} fill={fill.glow} opacity="0.5" filter={`url(#${glow})`} />
      <path d={STAR5} fill={fill.c} opacity="0.7" transform="translate(1.3 1.8)" />
      <path
        d={STAR5}
        fill={fill.b}
        stroke="#fff8"
        strokeWidth="1.15"
        strokeLinejoin="miter"
        strokeMiterlimit="8"
      />
      <path
        d={STAR5}
        fill={`url(#${g})`}
        stroke="none"
        strokeLinejoin="miter"
        strokeMiterlimit="8"
      />
      <SpecialMarks special={special} />
      <StarFace kind="star" brow={fill.brow} />
    </svg>
  )
}

export function NovaBomb({ id }: { id: string }) {
  const g = `nova-body-${id}`
  return (
    <div className="star-3d">
      <svg viewBox="0 0 64 64" className="star-art h-full w-full overflow-visible">
        <defs>
          <radialGradient id={g} cx="35%" cy="30%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="28%" stopColor="#c084fc" />
            <stop offset="70%" stopColor="#1a0a28" />
          </radialGradient>
        </defs>
        <path d={STAR5} fill="#c084fc" opacity="0.35" />
        <path
          d={STAR5}
          fill={`url(#${g})`}
          stroke="#ffd24a"
          strokeWidth="1.6"
          strokeLinejoin="miter"
          strokeMiterlimit="8"
        />
        <StarFace kind="nova" brow="#ffd24a" />
      </svg>
    </div>
  )
}

function specialMotion(special: Cell['special']) {
  if (special === 'none') return ''
  if (special === 'striped-h' || special === 'striped-v') return 'star-striped'
  if (special === 'color-bomb') return 'star-color-bomb'
  return 'star-wrapped'
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
  const uid = useId().replace(/:/g, '')
  const fill = cell.ingredient
    ? INGREDIENT_FILL
    : cell.color
      ? FILLS[cell.color]
      : { a: '#fff', b: '#888', c: '#333', glow: '#fff', brow: '#1a0c08' }
  const motion = exploding ? 'star-explode' : spawning ? 'star-spawn' : 'star-idle'
  const powerPlay = cell.special !== 'none' && !cell.ingredient
  const isColorBomb = cell.special === 'color-bomb'
  const showPiece =
    (cell.color || powerPlay || cell.ingredient || isColorBomb) &&
    !cell.frosting &&
    !cell.chocolate &&
    !cell.swirl

  return (
    <div
      className={`relative h-full w-full ${selected ? 'brightness-125' : ''}`}
      style={{
        ['--star-glow' as string]: fill.glow,
        ['--blink-delay' as string]: `${(delay ?? 0) + 280}ms`,
        filter: skin ? SKIN_FILTERS[skin] : undefined,
      }}
    >
      {cell.jelly > 0 ? <div className="jelly-well jelly-well--tile" /> : null}
      {cell.ingredient ? (
        <span className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#ff9f1c] px-1 text-[8px] font-extrabold text-void">
          ▼
        </span>
      ) : null}

      {cell.frosting > 0 ? (
        <div className="blocker-idle absolute inset-0 rounded-md bg-gradient-to-br from-white/80 to-sky-300/50 ring-2 ring-white/70">
          <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-sky-900">
            {cell.frosting}
          </span>
        </div>
      ) : null}

      {cell.chocolate ? (
        <div className="blocker-idle absolute inset-1 rounded-md bg-gradient-to-br from-[#5a3418] to-[#1a0c06] shadow-inner" />
      ) : null}

      {cell.swirl ? (
        <div className="blocker-idle absolute inset-1 rounded-full border-4 border-dashed border-[#3b2a22] bg-[#1a120c]" />
      ) : null}

      {showPiece ? (
        <div
          className={`h-full w-full ${motion} ${specialMotion(cell.special)}`}
          style={{ animationDelay: `${delay ?? 0}ms` }}
        >
          {isColorBomb ? (
            <NovaBomb id={uid} />
          ) : powerPlay ? (
            <SunCore id={uid} fill={fill} special={cell.special} powerPlay />
          ) : (
            <div className="star-3d">
              <SharpStar id={uid} fill={fill} special={cell.special} />
            </div>
          )}
        </div>
      ) : null}

      {cell.marmalade ? (
        <div className="marmalade-fx pointer-events-none absolute inset-0 rounded-md bg-[#ffb703]/45 mix-blend-multiply" />
      ) : null}
      {cell.lock ? (
        <div className="lock-fx pointer-events-none absolute inset-1 rounded-sm border-2 border-[#c9a227] bg-black/20" />
      ) : null}
      {cell.bomb > 0 ? (
        <span className="absolute right-0 top-0 z-10 rounded-full bg-red-600 px-1 text-[9px] font-bold">
          {cell.bomb}
        </span>
      ) : null}
    </div>
  )
}

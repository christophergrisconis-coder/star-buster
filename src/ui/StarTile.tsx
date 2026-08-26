import { useId } from 'react'
import { SKIN_FILTERS } from '~/data/store'
import type { Cell, StarColor } from '~/engine/types'
import { starArtSrc } from './starArt'
import { sunRayPath } from './starGeometry'

const FILLS: Record<StarColor, { a: string; b: string; c: string; glow: string; brow: string }> = {
  gold: { a: '#fff8d0', b: '#ffd24a', c: '#c2410c', glow: '#ffd24a', brow: '#7a2e09' },
  red: { a: '#ffd0d0', b: '#ff4b4b', c: '#7f1d1d', glow: '#ff4b4b', brow: '#3b0a0a' },
  green: { a: '#d4ffe4', b: '#3dff8a', c: '#14532d', glow: '#3dff8a', brow: '#0b2a16' },
  blue: { a: '#dbe8ff', b: '#4da3ff', c: '#1e3a8a', glow: '#4da3ff', brow: '#0b1d44' },
  purple: { a: '#f0e0ff', b: '#c084fc', c: '#6b21a8', glow: '#c084fc', brow: '#2e0a4a' },
  cyan: { a: '#d9fbff', b: '#22d3ee', c: '#155e75', glow: '#22d3ee', brow: '#083344' },
}

const INGREDIENT_FILL = { a: '#ffe0c2', b: '#ff8a4c', c: '#7a1d1d', glow: '#ff8a4c', brow: '#4a1208' }

/** Custom star logo art (Anaclara) with SVG special-mark overlays. */
function CustomStarArt({
  src,
  special,
  glow,
  powerPlay,
}: {
  src: string
  special: Cell['special']
  glow: string
  powerPlay?: boolean
}) {
  return (
    <div className="relative h-full w-full">
      <div
        className="pointer-events-none absolute inset-[-8%] rounded-full opacity-55 blur-[6px]"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 68%)` }}
        aria-hidden
      />
      <img
        src={src}
        alt=""
        draggable={false}
        className="star-art relative z-[1] h-full w-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
      />
      <svg viewBox="0 0 64 64" className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible" aria-hidden>
        {powerPlay ? (
          <circle cx="32" cy="32" r="30" fill="none" stroke="#ffd24a" strokeWidth="1.4" opacity="0.75" />
        ) : null}
        <SpecialMarks special={special} />
      </svg>
    </div>
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
  const rays = `sun-rays-${id}`
  return (
    <div className={`sun-3d ${powerPlay ? 'sun-power' : ''}`}>
      <div className="sun-flare-spin pointer-events-none absolute inset-[-10%]">
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
            <path d={sunRayPath(18, 15.2)} fill={`url(#${rays})`} opacity="0.9" />
          </svg>
        </div>
      </div>
      <CustomStarArt
        src={starArtSrc('gold', { heart: true })}
        special={special}
        glow={fill.glow}
        powerPlay={powerPlay}
      />
    </div>
  )
}

export function BlazingSun({ id, special }: { id: string; special: Cell['special'] }) {
  return <SunCore id={id} fill={FILLS.gold} special={special} powerPlay={special !== 'none'} />
}

export function SharpStar({
  id: _id,
  fill,
  special,
  color,
  ingredient,
}: {
  id: string
  fill: { a: string; b: string; c: string; glow: string; brow: string }
  special: Cell['special']
  color?: StarColor | null
  ingredient?: boolean
}) {
  void _id
  return (
    <CustomStarArt
      src={starArtSrc(color ?? null, { ingredient })}
      special={special}
      glow={fill.glow}
    />
  )
}

export function NovaBomb({ id: _id }: { id: string }) {
  void _id
  return (
    <div className="star-3d">
      <CustomStarArt src={starArtSrc(null, { nova: true })} special="color-bomb" glow="#c084fc" powerPlay />
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
              <SharpStar
                id={uid}
                fill={fill}
                special={cell.special}
                color={cell.color}
                ingredient={!!cell.ingredient}
              />
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

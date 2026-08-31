import { useId } from 'react'
import { SKIN_FILTERS } from '~/data/store'
import type { Cell, StarColor } from '~/engine/types'
import { isCoAdminPilot, useIsCoAdmin } from '~/lib/owner'
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
const CO_ADMIN_HUE: Record<StarColor, string> = {
  gold: 'hue-rotate(0deg) saturate(1.08)',
  red: 'hue-rotate(-35deg) saturate(1.3)',
  green: 'hue-rotate(75deg) saturate(1.12)',
  blue: 'hue-rotate(170deg) saturate(1.12)',
  purple: 'hue-rotate(235deg) saturate(1.1)',
  cyan: 'hue-rotate(145deg) saturate(1.08)',
}

/** Custom star logo art (Anaclara) with SVG special-mark overlays. */
function CustomStarArt({
  src: _src,
  special,
  glow,
  powerPlay,
  face = 'classic',
  faceSeed = 0,
}: {
  src: string
  special: Cell['special']
  glow: string
  powerPlay?: boolean
  face?: 'classic' | 'ana'
  faceSeed?: number
}) {
  void _src
  const powerName = special === 'striped-h'
    ? 'ROW BEAM'
    : special === 'striped-v'
      ? 'COLUMN BEAM'
      : special === 'wrapped'
        ? 'NOVA BURST'
        : special === 'color-bomb'
          ? 'PRISM BOMB'
          : null
  return (
    <div className={`relative h-full w-full ${powerName ? 'power-star-art' : ''}`}>
      <div
        className="pointer-events-none absolute inset-[-8%] rounded-full opacity-55 blur-[6px]"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 68%)` }}
        aria-hidden
      />
      <svg viewBox="0 0 64 64" className="star-art relative z-[1] h-full w-full overflow-visible drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]" aria-hidden>
        <defs>
          <radialGradient id={`core-${glow.replace(/[^a-z0-9]/gi, '')}`} cx="34%" cy="25%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.96" />
            <stop offset="24%" stopColor={glow} stopOpacity="0.95" />
            <stop offset="70%" stopColor={glow} stopOpacity="0.76" />
            <stop offset="100%" stopColor="#080611" stopOpacity="0.86" />
          </radialGradient>
          <linearGradient id="rainbow-power" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#22d3ee" />
            <stop offset=".33" stopColor="#ffd24a" />
            <stop offset=".66" stopColor="#ff4b4b" />
            <stop offset="1" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        {special === 'color-bomb' ? (
          <g className="prism-bomb-core">
            <path d={sunRayPath(16, 10.5)} fill="#fff" opacity=".9" />
            <circle cx="32" cy="32" r="18" fill="#07040f" stroke="#fff" strokeWidth="2.2" />
            <circle cx="32" cy="32" r="13" fill="none" stroke="url(#rainbow-power)" strokeWidth="6" />
            <circle cx="32" cy="32" r="5" fill="#fff" />
          </g>
        ) : (
          <path d="M32 3.5 38.1 20l16.8-2.3-11.2 12.8 11.2 12.1-16.7-1.7L32 60.5l-6.2-19.6-16.7 1.7 11.2-12.1L9.1 17.7 25.9 20 32 3.5Z" fill={`url(#core-${glow.replace(/[^a-z0-9]/gi, '')})`} stroke="rgba(255,255,255,.48)" strokeWidth="1.25" />
        )}
        <circle cx="27" cy="24" r="5" fill="#fff" opacity="0.28" />
        {special !== 'color-bomb' ? <StarFace special={special} variant={face} seed={faceSeed} /> : null}
      </svg>
      <svg viewBox="0 0 64 64" className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible" aria-hidden>
        {powerPlay ? (
          <circle cx="32" cy="32" r="30" fill="none" stroke="#ffd24a" strokeWidth="1.4" opacity="0.75" />
        ) : null}
        <SpecialMarks special={special} />
      </svg>
      {powerName ? <span className="power-star-label" aria-hidden>{powerName}</span> : null}
    </div>
  )
}

function StarFace({
  special,
  variant,
  seed,
}: {
  special: Cell['special']
  variant: 'classic' | 'ana'
  seed: number
}) {
  const expression = special !== 'none' ? 'brave' : ['grin', 'ooh', 'smirk'][Math.abs(seed) % 3]!
  const heartEyes = variant === 'ana' && expression !== 'brave' && seed % 3 === 0
  return (
    <g className={`star-face star-face--${expression}${variant === 'ana' ? ' star-face--ana' : ''}`} aria-hidden>
      <g className="star-eyes" fill={variant === 'ana' ? '#5a1748' : '#111827'}>
        {heartEyes ? (
          <>
            <path d="M21 30c-3-4 3-7 5-3 2-4 8-1 5 3l-5 5-5-5Z" />
            <path d="M35 30c-3-4 3-7 5-3 2-4 8-1 5 3l-5 5-5-5Z" />
          </>
        ) : expression === 'smirk' ? (
          <><path d="M20 29h9l-2 3h-5Z" /><circle cx="40" cy="30" r="3" /></>
        ) : (
          <><ellipse cx="25" cy="30" rx="3" ry="4" /><ellipse cx="40" cy="30" rx="3" ry="4" /></>
        )}
      </g>
      {expression === 'ooh' ? (
        <ellipse cx="32" cy="40" rx="4.3" ry="5" fill="none" stroke={variant === 'ana' ? '#5a1748' : '#111827'} strokeWidth="2" />
      ) : expression === 'brave' ? (
        <path d="M24 40 Q32 45 40 40" fill="none" stroke={variant === 'ana' ? '#5a1748' : '#111827'} strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <path d="M24 39 Q32 46 40 39" fill="none" stroke={variant === 'ana' ? '#5a1748' : '#111827'} strokeWidth="2.2" strokeLinecap="round" />
      )}
    </g>
  )
}

function SpecialMarks({ special }: { special: Cell['special'] }) {
  if (special === 'none') return null

  if (special === 'striped-h') {
    return (
      <>
        <path d="M2 32 14 22v6h36v-6l12 10-12 10v-6H14v6Z" fill="#fff" stroke="#ffd24a" strokeWidth="1.4" />
        <path d="M13 32h38" stroke="#ff4b4b" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  }

  if (special === 'striped-v') {
    return (
      <>
        <path d="M32 2 42 14h-6v36h6L32 62 22 50h6V14h-6Z" fill="#fff" stroke="#ffd24a" strokeWidth="1.4" />
        <path d="M32 13v38" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      </>
    )
  }

  if (special === 'color-bomb') {
    return (
      <>
        <circle cx="32" cy="32" r="25" fill="none" stroke="#ffd24a" strokeWidth="2.5" strokeDasharray="3 5" />
        <circle cx="32" cy="32" r="21" fill="none" stroke="#ff2bd6" strokeWidth="2" strokeDasharray="8 4" />
      </>
    )
  }

  return (
    <>
      <path d="M32 1 37 13l10-8-1 14 14-2-10 11 12 7-14 4 7 12-14-4-3 15-7-13-10 10 1-15-15 3 11-11L5 28l15-5-7-12 14 5Z" fill="none" stroke="#ff2bd6" strokeWidth="3" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2 3" />
      <path d="M32 8v10M32 46v10M8 32h10M46 32h10" stroke="#ffd24a" strokeWidth="3" strokeLinecap="round" />
    </>
  )
}

function CoAdminStarArt({
  color,
  special,
  glow,
  powerPlay,
}: {
  color: StarColor | null
  special: Cell['special']
  glow: string
  powerPlay?: boolean
}) {
  return (
    <div className={powerPlay ? 'sun-3d' : 'star-3d'} style={{ filter: CO_ADMIN_HUE[color ?? 'gold'] }}>
      <CustomStarArt src="/stars/ana-star.png" special={special} glow={glow} powerPlay={powerPlay} face="ana" faceSeed={color?.length ?? 0} />
    </div>
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
        src=""
        special={special}
        glow={fill.glow}
        powerPlay={powerPlay}
        faceSeed={id.length}
      />
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
  color,
  ingredient,
}: {
  id: string
  fill: { a: string; b: string; c: string; glow: string; brow: string }
  special: Cell['special']
  color?: StarColor | null
  ingredient?: boolean
}) {
  return (
    <CustomStarArt
      src=""
      special={special}
      glow={fill.glow}
      faceSeed={id.length + (color?.length ?? 0) + (ingredient ? 1 : 0)}
    />
  )
}

export function NovaBomb({ id: _id }: { id: string }) {
  void _id
  return (
    <div className="star-3d">
      <CustomStarArt src="" special="color-bomb" glow="#c084fc" powerPlay faceSeed={7} />
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
  reaction,
  delay,
  skin,
}: {
  cell: Cell
  selected?: boolean
  exploding?: boolean
  spawning?: boolean
  reaction?: 'dance' | 'spin' | 'cry' | 'launch' | 'supernova'
  delay?: number
  skin?: string
}) {
  const uid = useId().replace(/:/g, '')
  const fill = cell.ingredient
    ? INGREDIENT_FILL
    : cell.color
      ? FILLS[cell.color]
      : { a: '#fff', b: '#888', c: '#333', glow: '#fff', brow: '#1a0c08' }
  const motion = exploding
    ? `star-explode star-react-${reaction ?? 'launch'}`
    : spawning
      ? 'star-spawn'
      : 'star-idle'
  const powerPlay = cell.special !== 'none' && !cell.ingredient
  const isColorBomb = cell.special === 'color-bomb'
  const coAdminStarTheme = useIsCoAdmin()
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
          {reaction === 'cry' && exploding ? (
            <span className="star-tears" aria-hidden><i /><i /></span>
          ) : null}
          {coAdminStarTheme ? (
            <CoAdminStarArt
              color={cell.color}
              special={cell.special}
              glow={fill.glow}
              powerPlay={powerPlay || isColorBomb}
            />
          ) : isColorBomb ? (
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

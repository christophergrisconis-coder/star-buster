import { useEffect, useRef, useState } from 'react'
import { cometTailBanner } from '~/data/difficulty'
import { applyGravity } from '~/engine/gravity'
import {
  adjacent,
  isSwappable,
  occupies,
  starCell,
  type BlastSize,
  type Cell,
  type EngineEvent,
  type GameState,
} from '~/engine/types'
import { ComboBanner } from '~/fx/comboBanners'
import { BurstLayer } from '~/fx/particles'
import { INPUT_LOCK_SAFETY_MS, SLIDE_THRESHOLD_PX, shouldClearInputLock } from './inputLock'
import { KitPickup, type ActivePickup } from './KitPickup'
import { StarTile } from './StarTile'

type WaveEvent = Extract<EngineEvent, { type: 'wave' }>

type Piece = {
  id: number
  index: number
  cell: Cell
  visualY?: number
  exploding?: boolean
  spawning?: boolean
  blinkDelay: number
}

let pieceSeq = 1

function cloneCells(cells: Cell[]): Cell[] {
  return cells.map((c) => ({ ...c }))
}

function piecesFromCells(cells: Cell[]): Piece[] {
  return cells.flatMap((cell, index) =>
    occupies(cell) || cell.frosting > 0 || cell.chocolate
      ? [{ id: pieceSeq++, index, cell: { ...cell }, blinkDelay: (index % 8) * 40 }]
      : [],
  )
}

function preservePieces(cells: Cell[], prev: Piece[]): Piece[] {
  const byIndex = new Map(prev.map((p) => [p.index, p]))
  return cells.flatMap((cell, index) => {
    if (!(occupies(cell) || cell.frosting > 0 || cell.chocolate)) return []
    const old = byIndex.get(index)
    return [
      {
        id: old?.id ?? pieceSeq++,
        index,
        cell: { ...cell },
        exploding: false,
        spawning: false,
        blinkDelay: old?.blinkDelay ?? (index % 8) * 40,
      },
    ]
  })
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    if (ms <= 0) resolve()
    else window.setTimeout(resolve, ms)
  })
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function twoFrames() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

function explodeMs(size: BlastSize, reduced: boolean) {
  if (reduced) return 0
  return size === 'L' ? 520 : size === 'M' ? 430 : 360
}

function gravityMs(moves: WaveEvent['gravity'], width: number, reduced: boolean) {
  if (reduced) return 0
  if (moves.length === 0) return 60
  const rows = Math.max(
    ...moves.map((m) => Math.abs(Math.floor(m.to / width) - Math.floor(m.from / width))),
  )
  return Math.min(420, Math.max(180, 72 * rows))
}

function swapCells(cells: Cell[], a: number, b: number): Cell[] {
  const next = cloneCells(cells)
  const jellyA = next[a]!.jelly
  const jellyB = next[b]!.jelly
  const cellA = { ...next[a]!, jelly: jellyB }
  const cellB = { ...next[b]!, jelly: jellyA }
  next[a] = cellB
  next[b] = cellA
  return next
}

function wipeStar(cell: Cell): Cell {
  return {
    ...cell,
    color: null,
    special: 'none',
    swirl: false,
    ingredient: false,
    bomb: 0,
    marmalade: false,
    lock: false,
  }
}

function applyDestroyVisual(cells: Cell[], wave: WaveEvent): Cell[] {
  const next = cloneCells(cells)
  const spawns = new Map(wave.spawnedSpecials.map((s) => [s.index, s.special]))
  for (const i of wave.destroyed) {
    if (spawns.has(i)) continue
    next[i] = wipeStar(next[i]!)
  }
  for (const { index, special } of wave.spawnedSpecials) {
    const color = cells[index]!.color
    next[index] = { ...wipeStar(next[index]!), color, special: special === 'none' ? 'none' : 'wrapped' }
  }
  return next
}

function applyRefillVisual(cells: Cell[], wave: WaveEvent): Cell[] {
  const next = cloneCells(cells)
  for (const r of wave.refill) {
    next[r.index] = { ...starCell(r.color, next[r.index]!.jelly), special: r.special }
  }
  return next
}

function indexAt(
  el: HTMLElement,
  clientX: number,
  clientY: number,
  width: number,
  height: number,
): number | null {
  const r = el.getBoundingClientRect()
  if (r.width <= 0 || r.height <= 0) return null
  const x = Math.floor(((clientX - r.left) / r.width) * width)
  const y = Math.floor(((clientY - r.top) / r.height) * height)
  if (x < 0 || y < 0 || x >= width || y >= height) return null
  return x + y * width
}

function neighborInDirection(
  index: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
): number | null {
  const x = index % width
  const y = Math.floor(index / width)
  const nx = x + dx
  const ny = y + dy
  if (nx < 0 || ny < 0 || nx >= width || ny >= height) return null
  return nx + ny * width
}

function pickSwapTarget(
  index: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
  cells: Cell[],
): number | null {
  const horiz =
    Math.abs(dx) >= SLIDE_THRESHOLD_PX
      ? neighborInDirection(index, dx > 0 ? 1 : -1, 0, width, height)
      : null
  const vert =
    Math.abs(dy) >= SLIDE_THRESHOLD_PX
      ? neighborInDirection(index, 0, dy > 0 ? 1 : -1, width, height)
      : null
  const primary = Math.abs(dx) > Math.abs(dy) ? horiz : vert
  const secondary = primary === horiz ? vert : horiz
  const startOk = isSwappable(cells[index]!)
  const legal = (b: number | null) => b !== null && startOk && isSwappable(cells[b]!)
  if (legal(primary)) return primary
  if (legal(secondary)) return secondary
  return null
}

export function Board({
  state,
  onSwap,
  onCell,
  onIgnite,
  hint,
  skin,
  interaction = 'swap',
  allowedPair,
  spotlight,
  onDenied,
  onWave,
  onBusyChange,
  pickup,
  onCollectPickup,
}: {
  state: GameState
  onSwap: (a: number, b: number) => void
  onCell?: (index: number) => void
  onIgnite?: (index: number) => void
  hint?: { a: number; b: number } | null
  skin?: string
  interaction?: 'swap' | 'cell'
  allowedPair?: { a: number; b: number } | null
  spotlight?: number[]
  onDenied?: (index: number, reason: 'locked' | 'off-script') => void
  onWave?: (wave: WaveEvent) => void
  onBusyChange?: (busy: boolean) => void
  pickup?: ActivePickup | null
  onCollectPickup?: () => void
}) {
  const reduced = useReducedMotion()
  const boardRef = useRef<HTMLDivElement>(null)
  const settledRef = useRef(state.cells)
  const [pieces, setPieces] = useState<Piece[]>(() => piecesFromCells(state.cells))
  const piecesRef = useRef(pieces)
  piecesRef.current = pieces
  const [boardCells, setBoardCells] = useState(state.cells)
  const [selected, setSelected] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [waveCombo, setWaveCombo] = useState(0)
  const [burst, setBurst] = useState<{
    key: number
    indices: number[]
    size: BlastSize
  } | null>(null)
  const [flashes, setFlashes] = useState<number[]>([])
  const [sparks, setSparks] = useState<number[]>([])
  const [trails, setTrails] = useState<Array<{ key: number; x: number; y: number }>>([])
  const [sunBursts, setSunBursts] = useState<number[]>([])
  const [boardFx, setBoardFx] = useState('')
  const onWaveRef = useRef(onWave)
  onWaveRef.current = onWave
  const onBusyRef = useRef(onBusyChange)
  onBusyRef.current = onBusyChange
  const pointer = useRef<{ index: number; x: number; y: number; swapped?: boolean } | null>(null)
  const busyRef = useRef(false)
  const busyStartedAt = useRef<number | null>(null)
  const capturedRef = useRef<GameState>(state)
  const [clipId, setClipId] = useState(0)
  const [bounce, setBounce] = useState<{ a: number; b: number } | null>(null)

  const setLock = (on: boolean) => {
    busyRef.current = on
    if (on) busyStartedAt.current = performance.now()
    else busyStartedAt.current = null
    setBusy(on)
    onBusyRef.current?.(on)
  }

  const settleBoard = (cells: Cell[]) => {
    settledRef.current = cells
    setBoardCells(cells)
    setBurst(null)
    setFlashes([])
    setSparks([])
    setTrails([])
    setSunBursts([])
    setBoardFx('')
    setPieces((prev) => preservePieces(cells, prev))
  }

  useEffect(() => {
    const hasResolve = state.events.some((e) => e.type === 'wave' || e.type === 'swap')
    const invalid = state.events.find((e) => e.type === 'invalid-swap')
    if (invalid && invalid.type === 'invalid-swap') {
      setBounce({ a: invalid.a, b: invalid.b })
      const t = window.setTimeout(() => setBounce(null), 180)
      setLock(false)
      setSelected(null)
      return () => window.clearTimeout(t)
    }
    if (!hasResolve) return
    capturedRef.current = state
    setClipId((n) => n + 1)
  }, [state.events])

  useEffect(() => {
    if (busyRef.current) return
    if (state.events.some((e) => e.type === 'wave' || e.type === 'swap')) return
    settleBoard(state.cells)
  }, [state.cells])

  useEffect(() => {
    const t = window.setInterval(() => {
      if (shouldClearInputLock(busyStartedAt.current, performance.now())) setLock(false)
    }, 500)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    if (clipId === 0) return
    const snap = capturedRef.current
    const waves = snap.events.filter((e): e is WaveEvent => e.type === 'wave')
    const swapEv = snap.events.find((e) => e.type === 'swap')
    let cancelled = false
    let safety = 0

    let finished = false
    const finish = () => {
      window.clearTimeout(safety)
      if (cancelled || finished) return
      finished = true
      settleBoard(snap.cells)
      setLock(false)
      setSelected(null)
    }

    const run = async () => {
      if (reduced) {
        for (const wave of waves) onWaveRef.current?.(wave)
        const lastWord = [...waves].reverse().find((w) => w.word)?.word
        if (lastWord) setBanner(lastWord)
        finish()
        return
      }
      setLock(true)
      setSelected(null)
      let cells = cloneCells(settledRef.current)
      let moving = preservePieces(cells, piecesRef.current)

      if (swapEv && swapEv.type === 'swap') {
        cells = swapCells(cells, swapEv.a, swapEv.b)
        moving = moving.map((p) => {
          if (p.index === swapEv.a) return { ...p, index: swapEv.b }
          if (p.index === swapEv.b) return { ...p, index: swapEv.a }
          return p
        })
        setPieces(moving)
        setBoardCells(cells)
        setSparks([swapEv.a, swapEv.b])
        await wait(140)
        setSparks([])
        if (cancelled) return
      }

      for (const wave of waves) {
        if (cancelled) return
        onWaveRef.current?.(wave)
        setWaveCombo(wave.combo)
        setBanner(wave.word ?? (wave.groups >= 2 ? 'NICE' : wave.combo >= 2 ? `COMBO x${wave.combo}` : null))
        setBoardFx(wave.combo >= 2 || wave.blast !== 'S' ? 'board-shake' : 'board-pulse')
        const spawnAt = new Set(wave.spawnedSpecials.map((s) => s.index))
        const exploding = new Set(wave.destroyed)
        const goldHits = wave.destroyed.filter((i) => cells[i]?.color === 'gold')
        moving = moving.map((p) => ({
          ...p,
          exploding: exploding.has(p.index) && !spawnAt.has(p.index),
          spawning: false,
          cell: spawnAt.has(p.index)
            ? {
                ...p.cell,
                special: wave.spawnedSpecials.find((s) => s.index === p.index)!.special,
              }
            : p.cell,
        }))
        setPieces(moving)
        setBurst({ key: pieceSeq++, indices: wave.destroyed, size: wave.blast })
        setFlashes(wave.destroyed)
        setSunBursts(goldHits)
        await wait(explodeMs(wave.blast, reduced))
        if (cancelled) return

        cells = applyDestroyVisual(cells, wave)
        const dests = new Set(wave.gravity.map((m) => m.to))
        const froms = new Set(wave.gravity.map((m) => m.from))
        moving = moving.filter((p) => !p.exploding && !(dests.has(p.index) && !froms.has(p.index)))
        const moveMap = new Map(wave.gravity.map((m) => [m.from, m.to]))
        moving = moving.map((p) =>
          moveMap.has(p.index)
            ? { ...p, exploding: false, spawning: false, index: moveMap.get(p.index)! }
            : { ...p, exploding: false, spawning: false },
        )
        cells = applyGravity(cells, snap.width, snap.height).cells
        setPieces(moving)
        setBoardCells(cells)
        setFlashes([])
        setSunBursts([])
        setTrails(
          wave.gravity.map((m, i) => ({
            key: pieceSeq + i,
            x: m.from % snap.width,
            y: Math.floor(m.from / snap.width),
          })),
        )
        await wait(gravityMs(wave.gravity, snap.width, reduced))
        setTrails([])
        if (cancelled) return

        const refillAt = new Set(wave.refill.map((r) => r.index))
        moving = moving.filter((p) => !refillAt.has(p.index))
        const newcomers: Piece[] = wave.refill.map((r) => {
          const y = Math.floor(r.index / snap.width)
          return {
            id: pieceSeq++,
            index: r.index,
            cell: { ...starCell(r.color, cells[r.index]!.jelly), special: r.special },
            visualY: reduced ? y : -1 - (y % 3),
            spawning: true,
            blinkDelay: (r.index % 8) * 40,
          }
        })
        cells = applyRefillVisual(cells, wave)
        moving = [...moving, ...newcomers]
        setPieces(moving)
        setBoardCells(cells)
        if (!reduced && newcomers.length) {
          await twoFrames()
          if (cancelled) return
          const born = new Set(newcomers.map((n) => n.id))
          moving = moving.map((p) => (born.has(p.id) ? { ...p, visualY: undefined, spawning: false } : p))
          setPieces(moving)
          await wait(280)
        }
        setBoardFx('')
        if (cancelled) return
      }

      const tailWord = cometTailBanner(snap.cometTail)
      if (tailWord) {
        setWaveCombo(0)
        setBanner(tailWord)
        await wait(reduced ? 0 : 420)
      }
      if (cancelled) return
      finish()
    }

    const t = window.setTimeout(() => {
      void run()
    }, 0)
    safety = window.setTimeout(() => {
      cancelled = true
      settleBoard(snap.cells)
      setLock(false)
      setSelected(null)
    }, INPUT_LOCK_SAFETY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(t)
      window.clearTimeout(safety)
      if (!finished) settleBoard(snap.cells)
      setLock(false)
    }
  }, [clipId, reduced])

  const pairOk = (a: number, b: number) => {
    if (!allowedPair) return true
    return (
      (allowedPair.a === a && allowedPair.b === b) || (allowedPair.a === b && allowedPair.b === a)
    )
  }

  const emitSwap = (a: number, b: number): boolean => {
    if (busyRef.current || state.status !== 'playing') return false
    if (!adjacent(a, b, state.width)) return false
    if (!isSwappable(state.cells[a]!) || !isSwappable(state.cells[b]!)) {
      onDenied?.(a, 'locked')
      return false
    }
    if (!pairOk(a, b)) {
      onDenied?.(a, 'off-script')
      return false
    }
    setLock(true)
    setSelected(null)
    onSwap(a, b)
    return true
  }

  const handleTap = (index: number) => {
    if (busyRef.current || state.status !== 'playing') return
    if (interaction === 'cell') {
      onCell?.(index)
      return
    }
    const cell = state.cells[index]!
    if (!isSwappable(cell)) {
      onDenied?.(index, 'locked')
      setSelected(null)
      return
    }
    if (selected === index && cell.special !== 'none' && onIgnite) {
      if (allowedPair && !spotlight?.includes(index)) {
        onDenied?.(index, 'off-script')
        return
      }
      setLock(true)
      setSelected(null)
      onIgnite(index)
      return
    }
    if (selected === null) {
      setSelected(index)
      return
    }
    if (selected === index) {
      setSelected(null)
      return
    }
    if (adjacent(selected, index, state.width)) {
      emitSwap(selected, index)
      return
    }
    setSelected(index)
  }

  const releasePointer = (el: HTMLDivElement | null, pointerId?: number) => {
    pointer.current = null
    if (el && pointerId != null && el.hasPointerCapture(pointerId)) {
      el.releasePointerCapture(pointerId)
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (busyRef.current || state.status !== 'playing') return
    const el = boardRef.current
    if (!el) return
    const index = indexAt(el, e.clientX, e.clientY, state.width, state.height)
    if (index === null) return
    pointer.current = { index, x: e.clientX, y: e.clientY, swapped: false }
    el.setPointerCapture(e.pointerId)
  }

  const trySlide = (clientX: number, clientY: number) => {
    const start = pointer.current
    if (!start || start.swapped || interaction !== 'swap') return
    if (busyRef.current || state.status !== 'playing') return
    const dx = clientX - start.x
    const dy = clientY - start.y
    if (Math.hypot(dx, dy) < SLIDE_THRESHOLD_PX) return
    const b = pickSwapTarget(start.index, dx, dy, state.width, state.height, state.cells)
    if (b === null) return
    if (!emitSwap(start.index, b)) return
    start.swapped = true
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    trySlide(e.clientX, e.clientY)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = boardRef.current
    const start = pointer.current
    releasePointer(el, e.pointerId)
    if (!el || !start) return
    if (start.swapped) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    if (interaction === 'swap' && Math.hypot(dx, dy) > SLIDE_THRESHOLD_PX) {
      const b = pickSwapTarget(start.index, dx, dy, state.width, state.height, state.cells)
      if (b !== null) {
        emitSwap(start.index, b)
        return
      }
    }
    const tapped = indexAt(el, e.clientX, e.clientY, state.width, state.height) ?? start.index
    handleTap(tapped)
  }

  const dropMs = reduced ? 0 : 220

  return (
    <div className="relative mx-auto w-[min(100%,360px)]">
      <ComboBanner word={banner} combo={waveCombo} cometTail={state.cometTail} />
      <div className={`play-board relative aspect-square overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_40px_#ff2bd633] ${boardFx}`} aria-busy={busy}>
        <div
          ref={boardRef}
          className="absolute inset-1 z-10 touch-none"
          style={{ pointerEvents: 'auto', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={(e) => releasePointer(boardRef.current, e.pointerId)}
          onLostPointerCapture={() => {
            pointer.current = null
          }}
        >
          {burst ? (
            <BurstLayer
              burstKey={burst.key}
              indices={burst.indices}
              size={burst.size}
              width={state.width}
              height={state.height}
            />
          ) : null}
        <div
          className="relative h-full w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${state.width}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${state.height}, minmax(0, 1fr))`,
          }}
        >
          {boardCells.map((cell, i) => {
            const lit = hint && (hint.a === i || hint.b === i)
            const glow = spotlight?.includes(i)
            return (
              <div
                key={i}
                className={`relative ${lit || glow ? 'ring-2 ring-gold rounded-full' : ''} ${
                  selected === i ? 'ring-2 ring-magenta rounded-full' : ''
                }`}
              >
                <div className="absolute inset-[18%] rounded-full bg-white/5" />
                {cell.jelly > 0 ? (
                  <div className="absolute inset-1 rounded-full bg-[#5ce1ff]/20 ring-1 ring-[#5ce1ff]/40" />
                ) : null}
              </div>
            )
          })}
        </div>
        {flashes.map((i) => {
          const x = i % state.width
          const y = Math.floor(i / state.width)
          return (
            <span
              key={`f-${i}-${burst?.key ?? 0}`}
              className="star-flash"
              style={{
                left: `${((x + 0.5) / state.width) * 100}%`,
                top: `${((y + 0.5) / state.height) * 100}%`,
                width: burst?.size === 'L' ? '34%' : burst?.size === 'M' ? '26%' : '20%',
                height: burst?.size === 'L' ? '34%' : burst?.size === 'M' ? '26%' : '20%',
              }}
            />
          )
        })}
        {sparks.map((i) => {
          const x = i % state.width
          const y = Math.floor(i / state.width)
          return (
            <span
              key={`sp-${i}`}
              className="swap-spark"
              style={{
                left: `${((x + 0.5) / state.width) * 100}%`,
                top: `${((y + 0.5) / state.height) * 100}%`,
              }}
            />
          )
        })}
        {sunBursts.map((i) => {
          const x = i % state.width
          const y = Math.floor(i / state.width)
          return (
            <span
              key={`sun-${i}-${burst?.key ?? 0}`}
              className="sun-flare-burst"
              style={{
                left: `${((x + 0.5) / state.width) * 100}%`,
                top: `${((y + 0.5) / state.height) * 100}%`,
                width: '38%',
                height: '38%',
              }}
            />
          )
        })}
        {trails.map((t) => (
          <span
            key={`tr-${t.key}`}
            className="gravity-spark"
            style={{
              left: `${((t.x + 0.5) / state.width) * 100}%`,
              top: `${((t.y + 0.5) / state.height) * 100}%`,
            }}
          />
        ))}
        {pieces.map((p) => {
          const visible = occupies(p.cell) || p.cell.frosting > 0 || p.cell.chocolate || p.exploding
          if (!visible) return null
          const x = p.index % state.width
          const y = p.visualY ?? Math.floor(p.index / state.width)
          const moving = p.visualY !== undefined
          const bouncing = bounce && (bounce.a === p.index || bounce.b === p.index)
          const other = bouncing ? (bounce.a === p.index ? bounce.b : bounce.a) : null
          const ox = other != null ? (other % state.width) - x : 0
          const oy = other != null ? Math.floor(other / state.width) - Math.floor(p.index / state.width) : 0
          return (
            <div
              key={p.id}
              className={`piece-slot${moving && !p.exploding ? ' piece-moving' : ''}${bouncing ? ' swap-bounce' : ''}`}
              style={{
                width: `${100 / state.width}%`,
                height: `${100 / state.height}%`,
                transform: bouncing
                  ? `translate3d(${x * 100 + ox * 28}%, ${y * 100 + oy * 28}%, 0)`
                  : `translate3d(${x * 100}%, ${y * 100}%, 0)`,
                transition:
                  reduced || p.exploding
                    ? 'none'
                    : bouncing
                      ? 'transform 90ms ease-out'
                      : `transform ${dropMs}ms cubic-bezier(0.2, 0.85, 0.2, 1), opacity 220ms ease`,
                zIndex: p.exploding ? 6 : 2,
                padding: 2,
                pointerEvents: 'none',
              }}
            >
              <StarTile
                cell={p.cell}
                selected={selected === p.index}
                exploding={p.exploding}
                spawning={p.spawning}
                delay={p.blinkDelay}
                skin={skin}
              />
            </div>
          )
        })}
        </div>
        {pickup ? (
          <KitPickup
            pickup={pickup}
            width={state.width}
            height={state.height}
            onCollect={() => onCollectPickup?.()}
          />
        ) : null}
      </div>
    </div>
  )
}

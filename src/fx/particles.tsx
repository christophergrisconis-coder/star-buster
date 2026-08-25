import { useEffect, useRef } from 'react'
import type { BlastSize } from '~/engine/types'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

export function BurstLayer({
  burstKey,
  indices,
  size,
  width,
  height = 8,
  tint = 'match',
}: {
  burstKey: number
  indices: number[]
  size: BlastSize
  width: number
  height?: number
  tint?: 'match' | 'sun' | 'swap'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || burstKey === 0 || indices.length === 0) return
    const count = tint === 'swap' ? 6 : size === 'L' ? 16 : size === 'M' ? 12 : 9
    const speed = tint === 'sun' ? 2.8 : size === 'L' ? 2.8 : size === 'M' ? 2.1 : 1.6
    const colors =
      tint === 'sun'
        ? ['#fffce8', '#ffd24a', '#ff9f1c', '#fff']
        : tint === 'swap'
          ? ['#fff', '#ffd24a', '#ff2bd6']
          : size === 'L'
            ? ['#fff', '#ffd24a', '#ff2bd6', '#ff9f1c', '#c084fc']
            : ['#fff', '#ffd24a', '#ff2bd6']
    const next: Particle[] = []
    for (const i of indices) {
      const cx = ((i % width) + 0.5) / width
      const cy = (Math.floor(i / width) + 0.5) / height
      for (let n = 0; n < count; n++) {
        const ang = (n / count) * Math.PI * 2 + (n % 3) * 0.18
        next.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * speed * (0.55 + (n % 5) * 0.14),
          vy: Math.sin(ang) * speed * (0.55 + (n % 4) * 0.12) - (tint === 'sun' ? 0.4 : 0),
          life: 1,
          max: 0.22 + (n % 4) * 0.035,
          size: size === 'L' ? 3.6 : size === 'M' ? 2.7 : 2.1,
          color: colors[n % colors.length]!,
        })
      }
    }
    const cap = size === 'L' ? 110 : 84
    particles.current = next.slice(0, cap)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const started = performance.now()

    const tick = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const dt = 0.016
      const alive: Particle[] = []
      for (const p of particles.current) {
        p.x += (p.vx * dt) / width
        p.y += (p.vy * dt) / height
        p.vy += 2.1 * dt
        p.life -= dt / p.max
        if (p.life <= 0) continue
        alive.push(p)
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x * canvas.width, p.y * canvas.height, p.size * (0.55 + p.life), 0, Math.PI * 2)
        ctx.fill()
      }
      particles.current = alive
      if (alive.length && now - started < 520) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(rafRef.current)
      particles.current = []
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [burstKey, indices, size, width, height, tint])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-20"
      aria-hidden
    />
  )
}

export function GravityTrails({
  moves,
  width,
  height = 9,
  trailKey,
}: {
  moves: Array<{ from: number; to: number }>
  width: number
  height?: number
  trailKey: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || trailKey === 0 || moves.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    type Dot = { x: number; y: number; vy: number; life: number; size: number; color: string }
    const dots: Dot[] = []
    const colors = ['#ffd24a55', '#fff5', '#c084fc44']
    for (const m of moves.slice(0, 12)) {
      const rows = Math.abs(Math.floor(m.to / width) - Math.floor(m.from / width))
      if (rows < 2) continue
      const cx = ((m.from % width) + 0.5) / width
      const cy = (Math.floor(m.from / width) + 0.5) / height
      for (let n = 0; n < Math.min(rows, 4); n++) {
        dots.push({
          x: cx + (Math.random() - 0.5) * 0.02,
          y: cy + n * (1 / height) * 0.5,
          vy: 0.3 + Math.random() * 0.2,
          life: 1,
          size: 1.5 + Math.random(),
          color: colors[n % colors.length]!,
        })
      }
    }
    const started = performance.now()
    const tick = (now: number) => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
      ctx.clearRect(0, 0, w, h)
      const dt = 0.016
      const alive: Dot[] = []
      for (const d of dots) {
        d.y += d.vy * dt / height
        d.life -= dt * 2.5
        if (d.life <= 0) continue
        alive.push(d)
        ctx.globalAlpha = d.life * 0.6
        ctx.fillStyle = d.color
        ctx.beginPath()
        ctx.arc(d.x * w, d.y * h, d.size, 0, Math.PI * 2)
        ctx.fill()
      }
      dots.length = 0
      dots.push(...alive)
      if (alive.length && now - started < 400) rafRef.current = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w, h)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); dots.length = 0 }
  }, [trailKey, moves, width, height])

  return (
    <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-19" aria-hidden />
  )
}

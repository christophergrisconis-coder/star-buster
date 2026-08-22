import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'

type Intensity = 'full' | 'play'

type Star = {
  x: number
  y: number
  z: number
  r: number
  tw: number
  tws: number
  tint: number
}

type Dust = {
  x: number
  y: number
  r: number
  a: number
  hue: number
  ph: number
}

type Meteor = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  len: number
  width: number
}

type Nova = {
  x: number
  y: number
  r: number
  life: number
  max: number
}

function budget(intensity: Intensity, width: number) {
  const mobile = width <= 420
  if (intensity === 'play') {
    return { far: 26, mid: 14, near: 7, dust: 5, meteorMin: 9000, meteorMax: 18000, nova: false }
  }
  if (mobile) {
    return { far: 42, mid: 24, near: 11, dust: 9, meteorMin: 2800, meteorMax: 7200, nova: true }
  }
  return { far: 64, mid: 36, near: 16, dust: 14, meteorMin: 2200, meteorMax: 5600, nova: true }
}

function seedStars(n: number, z: number, rMin: number, rMax: number): Star[] {
  return Array.from({ length: n }, () => ({
    x: Math.random(),
    y: Math.random(),
    z,
    r: rMin + Math.random() * (rMax - rMin),
    tw: Math.random() * Math.PI * 2,
    tws: 0.0014 + Math.random() * 0.0028,
    tint: Math.random(),
  }))
}

function seedDust(n: number): Dust[] {
  const hues = [268, 175, 42, 310]
  return Array.from({ length: n }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    r: 28 + Math.random() * 70,
    a: 0.035 + Math.random() * 0.055,
    hue: hues[i % hues.length]!,
    ph: Math.random() * Math.PI * 2,
  }))
}

function starColor(s: Star, alpha: number) {
  if (s.tint < 0.55) return `rgba(255, 236, 210, ${alpha})`
  if (s.tint < 0.78) return `rgba(180, 230, 255, ${alpha})`
  if (s.tint < 0.92) return `rgba(255, 210, 90, ${alpha})`
  return `rgba(255, 160, 230, ${alpha})`
}

function drawMilkyWay(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dim: number) {
  ctx.save()
  ctx.translate(w * 0.48, h * 0.52)
  ctx.rotate(-0.52 + Math.sin(t * 0.000035) * 0.03)
  ctx.scale(1, 0.38)
  const g = ctx.createRadialGradient(0, 0, 8, 0, 0, w * 0.72)
  g.addColorStop(0, `rgba(230, 190, 255, ${0.11 * dim})`)
  g.addColorStop(0.28, `rgba(90, 50, 140, ${0.08 * dim})`)
  g.addColorStop(0.55, `rgba(20, 70, 90, ${0.05 * dim})`)
  g.addColorStop(1, 'rgba(7, 6, 15, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(0, 0, w * 0.78, h * 0.55, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawSwirl(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dim: number) {
  ctx.save()
  ctx.translate(w * 0.72, h * 0.18)
  ctx.rotate(t * 0.000045)
  ctx.globalAlpha = 0.16 * dim
  ctx.scale(1, 0.46)
  for (let arm = 0; arm < 3; arm++) {
    ctx.rotate((Math.PI * 2) / 3)
    const g = ctx.createLinearGradient(0, 0, 90, 40)
    g.addColorStop(0, 'rgba(255, 210, 74, 0.35)')
    g.addColorStop(0.45, 'rgba(255, 43, 214, 0.18)')
    g.addColorStop(1, 'rgba(92, 225, 255, 0)')
    ctx.strokeStyle = g
    ctx.lineWidth = 7
    ctx.beginPath()
    ctx.moveTo(8, 0)
    ctx.quadraticCurveTo(40, 18, 88, 8)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMeteor(ctx: CanvasRenderingContext2D, m: Meteor) {
  const speed = Math.hypot(m.vx, m.vy) || 1
  const nx = m.vx / speed
  const ny = m.vy / speed
  const fade = Math.max(0, m.life)
  const tx = m.x - nx * m.len
  const ty = m.y - ny * m.len
  const g = ctx.createLinearGradient(m.x, m.y, tx, ty)
  g.addColorStop(0, `rgba(255, 255, 245, ${fade})`)
  g.addColorStop(0.12, `rgba(255, 210, 74, ${fade * 0.95})`)
  g.addColorStop(0.4, `rgba(92, 225, 255, ${fade * 0.5})`)
  g.addColorStop(0.75, `rgba(255, 43, 214, ${fade * 0.22})`)
  g.addColorStop(1, 'rgba(255, 43, 214, 0)')
  ctx.strokeStyle = g
  ctx.lineWidth = m.width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(m.x, m.y)
  ctx.lineTo(tx, ty)
  ctx.stroke()
  ctx.fillStyle = `rgba(255, 255, 255, ${fade})`
  ctx.beginPath()
  ctx.arc(m.x, m.y, m.width * 0.85, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(255, 210, 74, ${fade * 0.35})`
  ctx.beginPath()
  ctx.arc(m.x, m.y, m.width * 2.2, 0, Math.PI * 2)
  ctx.fill()
}

function drawNova(ctx: CanvasRenderingContext2D, n: Nova) {
  const a = Math.sin(n.life * Math.PI) * 0.45
  ctx.strokeStyle = `rgba(255, 210, 74, ${a})`
  ctx.lineWidth = 1.6
  ctx.beginPath()
  ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = `rgba(255, 43, 214, ${a * 0.55})`
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(n.x, n.y, n.r * 0.62, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = `rgba(255, 248, 220, ${a * 0.35})`
  ctx.beginPath()
  ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2)
  ctx.fill()
}

function Planets() {
  return (
    <div className="galaxy-planets">
      <div className="gp gp-orbit-a gp--gas">
        <div className="gp-ring gp-ring-back" />
        <div className="gp-sphere">
          <span className="gp-bands" />
          <span className="gp-terminator" />
          <span className="gp-spec" />
        </div>
        <div className="gp-ring gp-ring-front" />
      </div>
      <div className="gp gp-orbit-b gp--ice">
        <div className="gp-sphere">
          <span className="gp-frost" />
          <span className="gp-terminator" />
          <span className="gp-spec" />
        </div>
      </div>
      <div className="gp gp-orbit-c gp--terra">
        <div className="gp-sphere">
          <span className="gp-land" />
          <span className="gp-terminator" />
          <span className="gp-spec" />
        </div>
      </div>
      <div className="gp gp-orbit-d gp--ember">
        <div className="gp-sphere">
          <span className="gp-ember-glow" />
          <span className="gp-terminator" />
          <span className="gp-spec" />
        </div>
      </div>
    </div>
  )
}

export function UniverseBackground({ intensity }: { intensity?: Intensity }) {
  const routeIntensity = useRouterState({
    select: (s): Intensity => (s.location.pathname.startsWith('/play') ? 'play' : 'full'),
  })
  const mode = intensity ?? routeIntensity
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduced = motion.matches
    let raf = 0
    let stars: Star[] = []
    let dust: Dust[] = []
    let meteors: Meteor[] = []
    let novas: Nova[] = []
    let nextMeteor = 0
    let nextNova = 0
    let last = 0
    let running = false

    const layout = () => {
      const dpr = Math.min(reduced || mode === 'play' ? 1.25 : 1.75, window.devicePixelRatio || 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const bw = Math.max(1, Math.floor(w * dpr))
      const bh = Math.max(1, Math.floor(h * dpr))
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw
        canvas.height = bh
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      return { w, h }
    }

    const rebuild = () => {
      const { w } = layout()
      const b = budget(mode, w)
      stars = [
        ...seedStars(b.far, 0.28, 0.5, 0.9),
        ...seedStars(b.mid, 0.58, 0.8, 1.35),
        ...seedStars(b.near, 0.92, 1.15, 1.85),
      ]
      dust = seedDust(b.dust)
      meteors = []
      novas = []
      const now = performance.now()
      nextMeteor = now + b.meteorMin
      nextNova = now + 14000 + Math.random() * 18000
    }

    const paintStatic = () => {
      const { w, h } = layout()
      ctx.clearRect(0, 0, w, h)
      drawMilkyWay(ctx, w, h, 0, mode === 'play' ? 0.45 : 1)
      drawSwirl(ctx, w, h, 0, mode === 'play' ? 0.35 : 0.85)
      for (const d of dust) {
        const g = ctx.createRadialGradient(d.x * w, d.y * h, 0, d.x * w, d.y * h, d.r)
        g.addColorStop(0, `hsla(${d.hue}, 70%, 62%, ${d.a * 1.4})`)
        g.addColorStop(1, `hsla(${d.hue}, 70%, 50%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const s of stars) {
        const a = 0.28 + s.z * 0.55
        ctx.fillStyle = starColor(s, a)
        ctx.fillRect(s.x * w, s.y * h, s.r, s.r)
      }
    }

    const tick = (now: number) => {
      if (!running) return
      const { w, h } = layout()
      const dim = mode === 'play' ? 0.55 : 1
      const dt = Math.min(48, now - last || 16)
      last = now
      ctx.clearRect(0, 0, w, h)
      drawMilkyWay(ctx, w, h, now, dim)
      drawSwirl(ctx, w, h, now, dim)

      for (const d of dust) {
        const x = ((d.x + Math.sin(now * 0.00004 + d.ph) * 0.04) % 1) * w
        const y = ((d.y + Math.cos(now * 0.00003 + d.ph) * 0.03) % 1) * h
        const g = ctx.createRadialGradient(x, y, 0, x, y, d.r)
        g.addColorStop(0, `hsla(${d.hue}, 72%, 64%, ${d.a * dim})`)
        g.addColorStop(1, `hsla(${d.hue}, 72%, 50%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, d.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const s of stars) {
        const tw = 0.38 + Math.sin(now * s.tws + s.tw) * 0.38
        const a = tw * s.z * dim
        const x = s.x * w + Math.sin(now * 0.00012 * s.z + s.tw) * (4 + s.z * 8)
        const y = (s.y * h + now * 0.0032 * s.z) % (h + 8)
        ctx.fillStyle = starColor(s, a)
        ctx.fillRect(x, y, s.r, s.r)
        if (s.z > 0.8 && tw > 0.62) {
          ctx.globalAlpha = a * 0.55
          ctx.fillRect(x - s.r * 1.6, y + s.r * 0.3, s.r * 4.2, s.r * 0.35)
          ctx.fillRect(x + s.r * 0.3, y - s.r * 1.6, s.r * 0.35, s.r * 4.2)
          ctx.globalAlpha = 1
        }
      }

      const b = budget(mode, w)
      if (now > nextMeteor && meteors.length < 2) {
        const fromLeft = Math.random() > 0.35
        meteors.push({
          x: fromLeft ? -20 : w * (0.15 + Math.random() * 0.7),
          y: Math.random() * h * 0.42,
          vx: (fromLeft ? 1 : 0.45) * (0.42 + Math.random() * 0.28) * (mode === 'play' ? 0.7 : 1),
          vy: (0.16 + Math.random() * 0.14) * (mode === 'play' ? 0.7 : 1),
          life: 1,
          max: 900 + Math.random() * 500,
          len: 56 + Math.random() * 48,
          width: 1.6 + Math.random() * 1.1,
        })
        nextMeteor = now + b.meteorMin + Math.random() * (b.meteorMax - b.meteorMin)
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]!
        m.x += m.vx * dt
        m.y += m.vy * dt
        m.life -= dt / m.max
        drawMeteor(ctx, m)
        if (m.life <= 0 || m.x > w + 40 || m.y > h + 40) meteors.splice(i, 1)
      }

      if (b.nova && now > nextNova && novas.length === 0) {
        novas.push({
          x: w * (0.2 + Math.random() * 0.6),
          y: h * (0.12 + Math.random() * 0.35),
          r: 4,
          life: 0,
          max: 2600,
        })
        nextNova = now + 18000 + Math.random() * 24000
      }
      for (let i = novas.length - 1; i >= 0; i--) {
        const n = novas[i]!
        n.life += dt / n.max
        n.r += dt * 0.038
        drawNova(ctx, n)
        if (n.life >= 1) novas.splice(i, 1)
      }

      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      if (reduced) paintStatic()
      else raf = requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onVis = () => {
      rootRef.current?.setAttribute('data-paused', document.hidden ? 'true' : 'false')
      if (document.hidden) stop()
      else start()
    }
    const onMotion = () => {
      reduced = motion.matches
      stop()
      rebuild()
      start()
    }

    rebuild()
    start()
    const ro = new ResizeObserver(() => {
      layout()
      if (reduced) paintStatic()
    })
    ro.observe(canvas)
    document.addEventListener('visibilitychange', onVis)
    motion.addEventListener('change', onMotion)
    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      motion.removeEventListener('change', onMotion)
    }
  }, [mode])

  const play = mode === 'play'

  return (
    <div
      ref={rootRef}
      className={`galaxy-fx pointer-events-none${play ? ' galaxy-fx--play' : ''}`}
      aria-hidden
    >
      <div className="galaxy-nebula" />
      <div className="galaxy-swirl" />
      <canvas ref={canvasRef} className="galaxy-canvas" />
      <Planets />
      <div className="galaxy-vignette" />
    </div>
  )
}

export const UniverseBackdrop = UniverseBackground

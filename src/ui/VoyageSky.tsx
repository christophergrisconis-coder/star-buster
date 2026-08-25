import { type RefObject, useEffect, useRef } from 'react'

type Star = { x: number; y: number; z: number; r: number; tw: number; spd: number; tint: number; flare: boolean }
type Cloud = { x: number; y: number; r: number; a: number; hue: number; sat: number; vx: number; vy: number }
type Comet = { x: number; y: number; vx: number; vy: number; life: number; w: number }

export function VoyageSky({ travelRef }: { travelRef: RefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let w = 1
    let h = 1
    let raf = 0
    let stars: Star[] = []
    let clouds: Cloud[] = []
    let comets: Comet[] = []
    let nextComet = 80
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const born = performance.now()

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const box = canvas.getBoundingClientRect()
      w = Math.max(1, Math.round(box.width * dpr))
      h = Math.max(1, Math.round(box.height * dpr))
      canvas.width = w
      canvas.height = h
    }

    const seed = () => {
      stars = Array.from({ length: w < 700 ? 210 : 300 }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.12 + Math.random() * 0.88,
        r: 0.4 + Math.random() * 1.55,
        tw: Math.random() * Math.PI * 2,
        spd: 0.55 + Math.random() * 2.2,
        tint: Math.random(),
        flare: Math.random() > 0.91,
      }))
      const month = new Date().getUTCMonth()
      const hues =
        month === 11 || month === 0
          ? [210, 198, 250, 18, 42, 175]
          : month >= 2 && month <= 4
            ? [140, 175, 42, 210, 18, 328]
            : month >= 8 && month <= 10
              ? [28, 18, 42, 262, 328, 210]
              : [262, 210, 18, 328, 175, 42]
      clouds = Array.from({ length: 8 }, (_, i) => ({
        x: Math.random(),
        y: Math.random(),
        r: 120 + Math.random() * 220,
        a: 0.1 + Math.random() * 0.1,
        hue: hues[i % hues.length]!,
        sat: 58 + (i % 3) * 8,
        vx: 0.004 + Math.random() * 0.008,
        vy: 0.006 + Math.random() * 0.01,
      }))
    }

    const spawnComet = () => {
      const fromRight = Math.random() > 0.3
      comets.push({
        x: fromRight ? w * (0.42 + Math.random() * 0.7) : -20,
        y: -28 + Math.random() * h * 0.22,
        vx: fromRight ? -3.6 - Math.random() * 2.4 : 2.2 + Math.random() * 1.6,
        vy: 4.4 + Math.random() * 2.8,
        life: 1,
        w: 1.5 + Math.random() * 2.2,
      })
      nextComet = 420 + Math.random() * 900
    }

    const paint = (dt: number, now: number) => {
      const travel = travelRef.current ?? 0
      const t = (now - born) / 1000

      const sky = ctx.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#12081f')
      sky.addColorStop(0.45, '#0a0618')
      sky.addColorStop(1, '#060310')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, w, h)

      const armX = w * (0.62 + Math.sin(t * 0.04) * 0.06) + travel * -8
      const armY = h * (0.28 + Math.cos(t * 0.03) * 0.04) + travel * -18
      const arm = ctx.createRadialGradient(armX, armY, 8, armX, armY, Math.max(w, h) * 0.55)
      arm.addColorStop(0, 'rgba(255, 214, 140, 0.16)')
      arm.addColorStop(0.28, 'rgba(160, 92, 255, 0.1)')
      arm.addColorStop(0.62, 'rgba(40, 90, 180, 0.06)')
      arm.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = arm
      ctx.fillRect(0, 0, w, h)

      for (const c of clouds) {
        const x = ((c.x + t * c.vx + travel * 0.016) % 1) * w
        const y = ((c.y + t * c.vy + travel * 0.024) % 1) * h
        const g = ctx.createRadialGradient(x, y, 8, x, y, c.r)
        g.addColorStop(0, `hsla(${c.hue} ${c.sat}% 64% / ${c.a})`)
        g.addColorStop(0.55, `hsla(${c.hue} ${c.sat}% 48% / ${c.a * 0.35})`)
        g.addColorStop(1, `hsla(${c.hue} ${c.sat}% 36% / 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, c.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const s of stars) {
        const y = ((((s.y + t * 0.012 * s.z + travel * 0.065 * s.z) % 1) + 1) % 1) * h
        const x = ((((s.x + t * 0.0035 * s.z + Math.sin(t * 0.08 + s.tw) * s.z * 0.012) % 1) + 1) % 1) * w
        const a = 0.32 + Math.sin(s.tw) * 0.46
        ctx.fillStyle =
          s.tint > 0.8 ? `rgba(255,214,120,${a})` : s.tint > 0.55 ? `rgba(190,230,255,${a})` : `rgba(255,248,236,${a})`
        ctx.beginPath()
        ctx.arc(x, y, s.r * (0.7 + s.z * 0.5), 0, Math.PI * 2)
        ctx.fill()
        if (s.flare) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.4})`
          ctx.lineWidth = 0.65
          ctx.beginPath()
          ctx.moveTo(x - s.r * 7, y)
          ctx.lineTo(x + s.r * 7, y)
          ctx.moveTo(x, y - s.r * 7)
          ctx.lineTo(x, y + s.r * 7)
          ctx.stroke()
        }
        s.tw += dt * 0.002 * s.spd
      }

      if (!reduced) {
        nextComet -= dt
        if (nextComet <= 0) spawnComet()
        comets = comets.filter((c) => c.life > 0 && c.y < h + 90 && c.x > -80 && c.x < w + 80)
        for (const c of comets) {
          c.x += c.vx * dt * 0.1
          c.y += c.vy * dt * 0.1
          c.life -= dt * 0.00034
          const fade = Math.max(0, c.life)
          const tailx = c.x - c.vx * 24
          const taily = c.y - c.vy * 24
          const g = ctx.createLinearGradient(c.x, c.y, tailx, taily)
          g.addColorStop(0, `rgba(255,255,255,${fade})`)
          g.addColorStop(0.2, `rgba(220,236,255,${fade * 0.82})`)
          g.addColorStop(0.62, `rgba(255,210,90,${fade * 0.28})`)
          g.addColorStop(1, 'rgba(255,210,90,0)')
          ctx.strokeStyle = g
          ctx.lineWidth = c.w
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(c.x, c.y)
          ctx.lineTo(tailx, taily)
          ctx.stroke()
          ctx.fillStyle = `rgba(255,255,255,${fade})`
          ctx.beginPath()
          ctx.arc(c.x, c.y, c.w * 1.1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    layout()
    seed()
    spawnComet()
    paint(16, performance.now())
    let last = performance.now()
    const loop = (now: number) => {
      paint(Math.min(48, now - last), now)
      last = now
      raf = requestAnimationFrame(loop)
    }
    if (!reduced) raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => {
      layout()
      seed()
      paint(16, performance.now())
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [travelRef])

  return <canvas ref={canvasRef} className="voyage-sky" aria-hidden />
}

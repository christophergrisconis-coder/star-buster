import { useEffect, useRef, useState } from 'react'

type Props = {
  /** Fire when a round reaches finale or won */
  active: boolean
  /** Prefer heavier shower on win vs finale */
  intensity?: 'finale' | 'won'
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
  hue: number
}

/**
 * End-of-round meteor shower with screen flash + device vibration.
 */
export function RoundFinaleFX({ active, intensity = 'won' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flash, setFlash] = useState(false)
  const [shake, setShake] = useState(false)
  const runKey = useRef(0)

  useEffect(() => {
    if (!active) {
      setFlash(false)
      setShake(false)
      return
    }

    runKey.current += 1
    const key = runKey.current
    setFlash(true)
    setShake(true)

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        // vibrate pattern: short bursts matching meteor impacts
        navigator.vibrate(intensity === 'won' ? [40, 40, 60, 40, 80, 50, 40] : [30, 50, 40, 50, 60])
      }
    } catch {
      /* ignore unsupported */
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const meteors: Meteor[] = []
    const count = intensity === 'won' ? 28 : 18
    const duration = intensity === 'won' ? 2600 : 2000
    const start = performance.now()

    const layout = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h }
    }

    const spawn = (w: number, h: number) => {
      const fromLeft = Math.random() > 0.35
      meteors.push({
        x: fromLeft ? -40 - Math.random() * 80 : Math.random() * w * 0.7,
        y: -20 - Math.random() * h * 0.25,
        vx: 6 + Math.random() * 10,
        vy: 9 + Math.random() * 12,
        life: 0,
        max: 0.55 + Math.random() * 0.7,
        len: 50 + Math.random() * 90,
        width: 1.4 + Math.random() * 2.4,
        hue: Math.random() > 0.55 ? 42 : Math.random() > 0.5 ? 310 : 190,
      })
    }

    let { w, h } = layout()
    for (let i = 0; i < count; i++) spawn(w, h)

    const onResize = () => {
      ;({ w, h } = layout())
    }
    window.addEventListener('resize', onResize)

    const tick = (now: number) => {
      if (!running || key !== runKey.current) return
      const elapsed = now - start
      ctx.clearRect(0, 0, w, h)

      // lingering sky glow
      const glow = Math.max(0, 1 - elapsed / duration)
      if (glow > 0.05) {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.2, 10, w * 0.5, h * 0.35, w * 0.7)
        g.addColorStop(0, `rgba(255, 220, 140, ${0.22 * glow})`)
        g.addColorStop(0.45, `rgba(255, 43, 214, ${0.12 * glow})`)
        g.addColorStop(1, 'rgba(7,6,15,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      if (elapsed < duration * 0.55 && meteors.length < count * 2.2 && Math.random() < 0.35) {
        spawn(w, h)
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i]!
        m.life += 0.016
        m.x += m.vx
        m.y += m.vy
        const t = m.life / m.max
        if (t >= 1 || m.y > h + 40 || m.x > w + 40) {
          meteors.splice(i, 1)
          continue
        }
        const alpha = (1 - t) * 0.95
        const ang = Math.atan2(m.vy, m.vx)
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(ang)
        const grad = ctx.createLinearGradient(-m.len, 0, 0, 0)
        grad.addColorStop(0, `hsla(${m.hue}, 100%, 70%, 0)`)
        grad.addColorStop(0.55, `hsla(${m.hue}, 100%, 72%, ${alpha * 0.55})`)
        grad.addColorStop(1, `rgba(255,255,255,${alpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth = m.width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(-m.len, 0)
        ctx.lineTo(0, 0)
        ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.arc(0, 0, m.width * 1.1, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (elapsed < duration || meteors.length > 0) {
        raf = requestAnimationFrame(tick)
      } else {
        setShake(false)
      }
    }

    raf = requestAnimationFrame(tick)
    const flashTimer = window.setTimeout(() => setFlash(false), 420)
    const endTimer = window.setTimeout(() => setShake(false), duration + 200)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.clearTimeout(flashTimer)
      window.clearTimeout(endTimer)
      window.removeEventListener('resize', onResize)
    }
  }, [active, intensity])

  if (!active && !flash && !shake) return null

  return (
    <div
      className={`round-finale-fx pointer-events-none fixed inset-0 z-[60] ${shake ? 'round-finale-shake' : ''}`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className={`round-finale-flash ${flash ? 'is-on' : ''}`} />
    </div>
  )
}

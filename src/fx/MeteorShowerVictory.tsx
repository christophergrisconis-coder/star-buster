import { useEffect, useRef, useState } from 'react'
import { synth } from '~/audio/synth'

interface Meteor {
  x: number
  y: number
  targetX: number
  targetY: number
  vx: number
  vy: number
  length: number
  size: number
  color: string
  trail: Array<{ x: number; y: number; alpha: number; size: number }>
  exploded: boolean
  sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>
}

export function MeteorShowerVictory({
  onFinished,
}: {
  onFinished?: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [flash, setFlash] = useState(true)
  const [shake, setShake] = useState(true)

  useEffect(() => {
    // Initial sound effect
    synth.win()
    const flashTimer = setTimeout(() => setFlash(false), 800)
    const shakeTimer = setTimeout(() => setShake(false), 2600)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = 0
    const meteors: Meteor[] = []
    const colors = [
      '#ffd24a', // Gold
      '#ff2bd6', // Magenta
      '#22d3ee', // Cyan
      '#ffffff', // White
      '#ff9f1c', // Solar Orange
      '#c084fc', // Nebula Purple
    ]

    const spawnMeteor = (delayRatio: number) => {
      const w = canvas.width || window.innerWidth
      const h = canvas.height || window.innerHeight
      const startX = Math.random() * w * 1.2 - w * 0.2
      const startY = -40 - Math.random() * 120
      const targetX = startX + 150 + Math.random() * 250
      const targetY = h * 0.3 + Math.random() * (h * 0.65)
      const dist = Math.hypot(targetX - startX, targetY - startY)
      const speed = 700 + Math.random() * 500
      const duration = dist / speed

      meteors.push({
        x: startX,
        y: startY,
        targetX,
        targetY,
        vx: (targetX - startX) / duration,
        vy: (targetY - startY) / duration,
        length: 60 + Math.random() * 70,
        size: 3.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        trail: [],
        exploded: false,
        sparks: [],
      })
    }

    // Launch wave of 18 meteors over 2 seconds
    for (let i = 0; i < 18; i++) {
      setTimeout(() => spawnMeteor(i / 18), i * 110 + Math.random() * 60)
    }

    let lastTime = performance.now()
    const startTime = performance.now()

    const render = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000)
      lastTime = now

      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const m of meteors) {
        if (!m.exploded) {
          m.x += m.vx * dt
          m.y += m.vy * dt

          // Add trail point
          m.trail.unshift({ x: m.x, y: m.y, alpha: 1.0, size: m.size })
          if (m.trail.length > 22) m.trail.pop()

          // Draw trail
          for (let t = 0; t < m.trail.length; t++) {
            const pt = m.trail[t]!
            pt.alpha -= dt * 2.2
            if (pt.alpha <= 0) continue

            const trailWidth = pt.size * (1 - t / m.trail.length)
            ctx.save()
            ctx.globalAlpha = Math.max(0, pt.alpha * 0.8)
            ctx.fillStyle = m.color
            ctx.shadowColor = m.color
            ctx.shadowBlur = 12
            ctx.beginPath()
            ctx.arc(pt.x, pt.y, trailWidth, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }

          // Draw head
          ctx.save()
          ctx.shadowColor = '#ffffff'
          ctx.shadowBlur = 18
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(m.x, m.y, m.size * 1.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          // Check if meteor reached impact point
          if (m.y >= m.targetY) {
            m.exploded = true
            synth.explode('M')
            // Spawn impact sparks
            const sparkCount = 24
            for (let s = 0; s < sparkCount; s++) {
              const angle = Math.random() * Math.PI * 2
              const speed = 120 + Math.random() * 260
              m.sparks.push({
                x: m.x,
                y: m.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: colors[Math.floor(Math.random() * colors.length)]!,
              })
            }
          }
        } else {
          // Render explosion sparks
          for (const s of m.sparks) {
            s.x += s.vx * dt
            s.y += s.vy * dt
            s.vy += 180 * dt // gravity
            s.life -= dt * 1.6
            if (s.life <= 0) continue

            ctx.save()
            ctx.globalAlpha = Math.max(0, s.life)
            ctx.fillStyle = s.color
            ctx.shadowColor = s.color
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        }
      }

      if (now - startTime < 3800) {
        animId = requestAnimationFrame(render)
      } else {
        onFinished?.()
      }
    }

    animId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(animId)
      clearTimeout(flashTimer)
      clearTimeout(shakeTimer)
    }
  }, [])

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 overflow-hidden transition-all ${
        shake ? 'meteor-screen-shake' : ''
      }`}
    >
      {/* Radiant Screen Lighting Flash */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-amber-400/25 via-magenta/20 to-cyan-400/20 transition-opacity duration-700 ${
          flash ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Ambient Pulsing Cosmic Aura */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,210,74,0.18),transparent_60%)] animate-pulse" />

      {/* Meteor Shower Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  )
}

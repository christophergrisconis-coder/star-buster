import { useEffect, useRef } from 'react'

export function UniverseBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      t: Math.random() * Math.PI * 2,
    }))
    const shooters: Array<{ x: number; y: number; vx: number; vy: number; life: number }> = []

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio
      canvas.height = canvas.clientHeight * devicePixelRatio
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = (now: number) => {
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)
      const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 20, w * 0.5, h * 0.5, w * 0.7)
      g.addColorStop(0, 'rgba(80, 20, 90, 0.35)')
      g.addColorStop(1, 'rgba(7, 7, 17, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        const x = s.x * w + Math.sin(now / 900 + s.t) * 8 * s.z
        const y = (s.y * h + now * 0.008 * s.z) % h
        ctx.fillStyle = `rgba(255, 230, 180, ${0.35 + s.z * 0.6})`
        ctx.fillRect(x, y, 1.4 * s.z * devicePixelRatio, 1.4 * s.z * devicePixelRatio)
      }

      if (Math.random() < 0.012) {
        shooters.push({
          x: Math.random() * w,
          y: Math.random() * h * 0.4,
          vx: 4 + Math.random() * 6,
          vy: 1.4 + Math.random() * 2,
          life: 1,
        })
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i]!
        sh.x += sh.vx * devicePixelRatio
        sh.y += sh.vy * devicePixelRatio
        sh.life -= 0.016
        ctx.strokeStyle = `rgba(255, 210, 80, ${sh.life})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(sh.x, sh.y)
        ctx.lineTo(sh.x - 40, sh.y - 12)
        ctx.stroke()
        if (sh.life <= 0) shooters.splice(i, 1)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={ref} className="h-full w-full" />
      <div className="planet-bob absolute left-[8%] top-[18%] h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-orange-600 shadow-[0_0_40px_#ffb347aa] animate-[float-planet_4s_ease-in-out_infinite_alternate]" />
      <div className="planet-bob absolute right-[12%] top-[28%] h-10 w-10 rounded-full bg-gradient-to-br from-cyan-200 to-indigo-600 shadow-[0_0_28px_#5ce1ffaa] animate-[float-planet_5.5s_ease-in-out_infinite_alternate]" />
      <div className="absolute left-1/2 top-[12%] h-24 w-24 -translate-x-1/2 rounded-full bg-gradient-to-b from-yellow-100 to-amber-500 blur-[1px] shadow-[0_0_80px_#ffd24a]" />
      <svg className="absolute inset-0 h-full w-full opacity-70" viewBox="0 0 400 800">
        <ellipse cx="200" cy="420" rx="160" ry="40" fill="none" stroke="#ff2bd655" strokeWidth="1" />
        <ellipse cx="200" cy="420" rx="110" ry="24" fill="none" stroke="#ffd24a44" strokeWidth="1" />
        <ellipse cx="200" cy="420" rx="70" ry="14" fill="none" stroke="#ffffff22" strokeWidth="1" />
      </svg>
    </div>
  )
}

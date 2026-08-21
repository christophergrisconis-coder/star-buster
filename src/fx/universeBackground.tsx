import { useEffect, useRef } from 'react'

export function UniverseBackground() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    const stars = Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.3 + Math.random() * 0.7,
      tw: Math.random() * Math.PI * 2,
    }))
    const dust = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 8 + Math.random() * 28,
      a: Math.random() * 0.08,
    }))

    const draw = (t: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      ctx.clearRect(0, 0, w, h)
      for (const d of dust) {
        ctx.fillStyle = `rgba(180, 80, 255, ${d.a})`
        ctx.beginPath()
        ctx.arc((d.x * w + Math.sin(t / 8000) * 20) % w, d.y * h, d.r, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const s of stars) {
        const tw = 0.4 + Math.sin(t / 400 + s.tw) * 0.4
        ctx.fillStyle = `rgba(255, 230, 180, ${tw * s.z})`
        ctx.fillRect(s.x * w, (s.y * h + t * 0.004 * s.z) % h, 1.4 * s.z, 1.4 * s.z)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="shooting-star absolute left-[-10%] top-[12%] h-px w-24 bg-gradient-to-r from-transparent to-white opacity-80" />
      <div className="planet planet-a absolute left-[12%] top-[22%]" />
      <div className="planet planet-b absolute right-[8%] top-[38%]" />
      <div className="planet planet-c absolute left-[40%] bottom-[18%]" />
      <style>{`
        .shooting-star { animation: shoot 4.8s linear infinite; }
        .planet { border-radius: 999px; animation: orb-pulse 6s ease-in-out infinite; }
        .planet-a { width: 42px; height: 42px; background: radial-gradient(circle at 30% 30%, #ffe08a, #c45a12); box-shadow: 0 0 24px #ffb34788; }
        .planet-b { width: 28px; height: 28px; background: radial-gradient(circle at 30% 30%, #9ae6ff, #2456c9); box-shadow: 0 0 18px #5ce1ff88; animation-delay: -2s; }
        .planet-c { width: 54px; height: 54px; background: radial-gradient(circle at 35% 30%, #d4b4ff, #5b1d8a); box-shadow: 0 0 28px #c084fc66; animation-delay: -3.4s; }
        .planet-c::after { content:''; position:absolute; inset: 40% -18px; border: 2px solid rgba(255,210,74,.45); border-radius: 999px; transform: rotate(-18deg); }
      `}</style>
    </div>
  )
}

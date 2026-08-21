import { useEffect, useState } from 'react'

export function OrbBurst({ trigger, x, y }: { trigger: number; x: number; y: number }) {
  const [bits, setBits] = useState<Array<{ id: number; dx: number; dy: number }>>([])
  useEffect(() => {
    if (!trigger) return
    setBits(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        dx: Math.cos((i / 18) * Math.PI * 2) * (40 + (i % 5) * 12),
        dy: Math.sin((i / 18) * Math.PI * 2) * (40 + (i % 4) * 10),
      })),
    )
    const t = window.setTimeout(() => setBits([]), 520)
    return () => window.clearTimeout(t)
  }, [trigger])
  return (
    <div className="pointer-events-none absolute z-40" style={{ left: x, top: y }}>
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute h-2 w-2 rounded-full bg-gold"
          style={{
            transform: `translate3d(${b.dx}px, ${b.dy}px, 0)`,
            opacity: 0,
            boxShadow: '0 0 10px #ff2bd6',
            transition: 'transform 480ms ease-out, opacity 480ms ease-out',
          }}
        />
      ))}
    </div>
  )
}

export function explodeThen(navigate: () => void, wait = 420) {
  window.setTimeout(navigate, wait)
}

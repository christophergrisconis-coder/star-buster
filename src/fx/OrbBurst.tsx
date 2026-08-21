import { useEffect, useState } from 'react'

export function OrbBurst({
  x,
  y,
  onDone,
}: {
  x: number
  y: number
  onDone?: () => void
}) {
  const [alive, setAlive] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setAlive(false)
      onDone?.()
    }, 620)
    return () => clearTimeout(t)
  }, [onDone])

  if (!alive) return null

  return (
    <div className="pointer-events-none fixed z-50" style={{ left: x, top: y }}>
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{
            background: i % 2 ? '#ff2bd6' : '#ffd24a',
            boxShadow: '0 0 12px currentColor',
            animation: `mote 0.6s ease-out forwards`,
            transform: `rotate(${i * 20}deg) translate3d(0, -8px, 0)`,
          }}
        />
      ))}
      <span
        className="absolute h-24 w-24 rounded-full border-2 border-accent"
        style={{ animation: 'burst 0.55s ease-out forwards', left: 0, top: 0 }}
      />
    </div>
  )
}

export function useOrbExplode() {
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null)

  const explode = (event: { clientX: number; clientY: number }) => {
    setBurst({ x: event.clientX, y: event.clientY, key: Date.now() })
  }

  const node = burst ? (
    <OrbBurst key={burst.key} x={burst.x} y={burst.y} onDone={() => setBurst(null)} />
  ) : null

  return { explode, node }
}

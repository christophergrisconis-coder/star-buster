export function BurstLayer({
  indices,
  size,
  width,
}: {
  indices: number[]
  size: 'S' | 'M' | 'L'
  width: number
}) {
  const scale = size === 'L' ? 2.2 : size === 'M' ? 1.6 : 1.1
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {indices.map((i) => {
        const x = (i % width) * 40 + 20
        const y = Math.floor(i / width) * 40 + 20
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: x,
              top: y,
              width: 10 * scale,
              height: 10 * scale,
              marginLeft: -5 * scale,
              marginTop: -5 * scale,
              background: 'radial-gradient(circle, #fff 0%, #ff2bd6 40%, transparent 70%)',
              transform: 'translate3d(0,0,0) scale(1)',
              animation: 'star-explode 400ms ease-out both',
            }}
          />
        )
      })}
    </div>
  )
}

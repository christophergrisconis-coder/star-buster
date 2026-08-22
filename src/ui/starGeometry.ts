/** Cute 5-point star (inner/outer ≈ 0.40). Inset so tips stay visible at ~36–44px. */
export const STAR5 =
  'M32.00 4.20 L38.92 22.46 L58.42 22.42 L42.68 34.18 L48.72 52.80 L32.00 41.20 L15.28 52.80 L21.32 34.18 L5.58 22.42 L25.08 22.46 Z'

/** Slightly larger outline used as a wrapped-star ribbon (not a circle/octagon). */
export const STAR5_WRAP =
  'M32.00 1.40 L39.80 21.70 L61.20 21.64 L43.40 34.70 L50.10 55.80 L32.00 42.80 L13.90 55.80 L20.60 34.70 L2.80 21.64 L24.20 21.70 Z'

export function sunRayPath(count = 16, inner = 15.4): string {
  const parts: string[] = []
  for (let i = 0; i < count; i++) {
    const long = i % 2 === 0
    const ang = (i / count) * Math.PI * 2 - Math.PI / 2
    const outer = long ? 31.6 : 24.2
    const spread = long ? 0.12 : 0.09
    const x = (r: number, a: number) => (32 + Math.cos(a) * r).toFixed(2)
    const y = (r: number, a: number) => (32 + Math.sin(a) * r).toFixed(2)
    parts.push(
      `M${x(outer, ang)} ${y(outer, ang)} L${x(inner, ang - spread)} ${y(inner, ang - spread)} L${x(inner, ang + spread)} ${y(inner, ang + spread)} Z`,
    )
  }
  return parts.join(' ')
}

export const SUN_FLARES = sunRayPath()

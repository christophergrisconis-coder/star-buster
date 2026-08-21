/** Deterministic mulberry32-style PRNG. State is a signed 32-bit int. */
export function nextRng(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const next = t | 0
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296
  return { value, state: next }
}

export function rngInt(state: number, maxExclusive: number): {
  n: number
  state: number
} {
  const r = nextRng(state)
  return { n: Math.floor(r.value * maxExclusive), state: r.state }
}

export function rngPick<T>(state: number, items: readonly T[]): {
  item: T
  state: number
} {
  const r = rngInt(state, items.length)
  return { item: items[r.n]!, state: r.state }
}

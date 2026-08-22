import { useEffect, useState } from 'react'

const GLOW: Record<string, string> = {
  NICE: '0 0 22px #5ce1ff, 0 2px 0 #1a0a08',
  SWEET: '0 0 22px #ff2bd6, 0 2px 0 #1a0a08',
  SUPERSTAR: '0 0 26px #ffd24a, 0 0 48px #ff2bd6, 0 2px 0 #1a0a08',
  STELLAR: '0 0 26px #c084fc, 0 2px 0 #1a0a08',
  SUPERNOVA: '0 0 28px #ff9f1c, 0 0 52px #ff2bd6, 0 2px 0 #1a0a08',
  'GALAXY BUSTER': '0 0 30px #fff, 0 0 60px #ff2bd6, 0 2px 0 #1a0a08',
}

export function ComboBanner({
  word,
  combo,
  cometTail,
}: {
  word: string | null
  combo: number
  cometTail?: number
}) {
  const [shown, setShown] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const text = word ?? ''
    if (!text) return
    setShown(text)
    setTick((n) => n + 1)
    setLabel(
      combo > 1 && word && !word.startsWith('COMBO') && !word.includes('TAIL') && !word.includes('WAKE') && !word.includes('TRAIL')
        ? `COMBO x${combo}`
        : cometTail && cometTail >= 3 && word && !word.includes('TAIL') && !word.includes('WAKE') && !word.includes('TRAIL')
          ? `COMET TAIL x${cometTail}`
          : '',
    )
    const t = window.setTimeout(() => setShown(null), 980)
    return () => window.clearTimeout(t)
  }, [word, combo, cometTail])
  if (!shown) return null
  const glow = GLOW[shown] ?? '0 0 22px #ff2bd6, 0 2px 0 #1a0a08'
  return (
    <div
      key={tick}
      className="display pointer-events-none absolute left-1/2 top-6 z-30 text-center text-[30px] font-black tracking-wide text-[#ffd24a]"
      style={{
        animation: 'banner-pop 980ms ease-out both',
        textShadow: glow,
      }}
    >
      {shown}
      {label ? <div className="text-[14px] text-magenta">{label}</div> : null}
    </div>
  )
}

export function BadgeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-gold/40 bg-void/80 px-4 py-2 text-[12px] text-gold">
      Badge unlocked: {text}
    </div>
  )
}

export function ChallengeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-cyan-300/40 bg-void/85 px-4 py-2 text-center text-[12px] text-cyan-100 shadow-[0_0_24px_#5ce1ff55]">
      {text}
    </div>
  )
}

import { useEffect, useState } from 'react'

const GLOW: Record<string, string> = {
  NICE: '0 0 22px #5ce1ff, 0 2px 0 #1a0a08',
  SWEET: '0 0 22px #ff2bd6, 0 2px 0 #1a0a08',
  SUPERSTAR: '0 0 26px #ffd24a, 0 0 48px #ff2bd6, 0 2px 0 #1a0a08',
  STELLAR: '0 0 26px #c084fc, 0 2px 0 #1a0a08',
  'STELLAR CHAIN': '0 0 28px #5ce1ff, 0 0 50px #c084fc, 0 2px 0 #1a0a08',
  'HYPER BURST': '0 0 32px #ff2bd6, 0 0 54px #ffd24a, 0 2px 0 #1a0a08',
  SUPERNOVA: '0 0 35px #ff9f1c, 0 0 60px #ff2bd6, 0 2px 0 #1a0a08',
  'COSMIC ECLIPSE': '0 0 40px #c084fc, 0 0 70px #5ce1ff, 0 2px 0 #1a0a08',
  'GALAXY BUSTER': '0 0 45px #fff, 0 0 75px #ffd24a, 0 2px 0 #1a0a08',
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
    let text = word ?? ''
    if (combo >= 5 && !word) text = 'COSMIC ECLIPSE'
    else if (combo === 4 && !word) text = 'SUPERNOVA'
    else if (combo === 3 && !word) text = 'HYPER BURST'
    else if (combo === 2 && !word) text = 'STELLAR CHAIN'

    if (!text) return
    setShown(text)
    setTick((n) => n + 1)
    setLabel(
      combo > 1 && !text.startsWith('COMBO') && !text.includes('TAIL')
        ? `CASCADE x${combo}`
        : cometTail && cometTail >= 3
          ? `COMET TAIL x${cometTail}`
          : '',
    )
    const t = window.setTimeout(() => setShown(null), 1100)
    return () => window.clearTimeout(t)
  }, [word, combo, cometTail])

  if (!shown) return null
  const glow = GLOW[shown] ?? '0 0 25px #ff2bd6, 0 2px 0 #1a0a08'

  return (
    <div
      key={tick}
      className="display pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2 text-center"
      style={{
        animation: 'banner-pop 1100ms cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div
        className="text-[32px] font-black tracking-widest text-[#ffd24a] drop-shadow-md"
        style={{ textShadow: glow }}
      >
        {shown}
      </div>
      {label ? (
        <div className="mt-0.5 inline-block rounded-full bg-void/80 px-3 py-0.5 text-[12px] font-bold uppercase tracking-wider text-magenta border border-magenta/40">
          ⚡ {label} ⚡
        </div>
      ) : null}
    </div>
  )
}

export function BadgeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="pointer-events-none absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-gold/50 bg-void/90 px-5 py-2 text-[13px] font-semibold text-gold shadow-[0_0_20px_#ffd24a44]">
      🏆 Badge Unlocked: {text}
    </div>
  )
}

export function ChallengeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-cyan-300/50 bg-void/90 px-5 py-2 text-center text-[13px] text-cyan-100 shadow-[0_0_28px_#5ce1ff66]">
      ✨ {text}
    </div>
  )
}

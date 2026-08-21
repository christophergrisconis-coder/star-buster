import { useEffect, useState } from 'react'

export function ComboBanner({ word, combo }: { word: string | null; combo: number }) {
  const [shown, setShown] = useState<string | null>(null)
  useEffect(() => {
    if (!word) return
    setShown(word)
    const t = window.setTimeout(() => setShown(null), 900)
    return () => window.clearTimeout(t)
  }, [word, combo])
  if (!shown) return null
  return (
    <div
      className="display pointer-events-none absolute left-1/2 top-10 z-30 text-center text-[28px] font-black text-[#ffd24a]"
      style={{
        animation: 'banner-pop 900ms ease-out both',
        textShadow: '0 0 18px #ff2bd6, 0 2px 0 #1a0a08',
      }}
    >
      {shown}
      {combo > 3 ? <div className="text-[14px] text-magenta">STREAK x{combo}</div> : null}
    </div>
  )
}

export function BadgeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-gold/40 bg-void/80 px-4 py-2 text-[12px] text-gold">
      Badge unlocked: {text}
    </div>
  )
}

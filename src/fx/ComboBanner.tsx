import type { ComboWord } from '~/engine/types'

export function ComboBanner({ word, streak }: { word?: ComboWord; streak: number }) {
  if (!word) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center">
      <div
        className="font-display text-3xl font-black tracking-widest text-gold drop-shadow-[0_0_18px_#ffd24a]"
        style={{ animation: 'banner-pop 900ms ease-out both' }}
      >
        {word}
      </div>
      {streak >= 3 ? (
        <div className="mt-1 rounded-full bg-accent/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          Streak ×{streak}
        </div>
      ) : null}
    </div>
  )
}

export function BadgeToast({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-gold/40 bg-space-900/90 px-4 py-2 text-xs tracking-wide text-gold shadow-[0_0_24px_#ffd24a55]">
      Badge unlocked · {text}
    </div>
  )
}

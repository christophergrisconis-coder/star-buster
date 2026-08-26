import { useState, useEffect } from 'react'
import { STREAK_REWARDS, getStreakState, canClaimToday, claimDailyStreak, type StreakDayReward } from '~/data/streak'
import { synth } from '~/audio/synth'

export function DailyStreakModal({
  isOpen,
  onClose,
  onClaimed,
}: {
  isOpen: boolean
  onClose: () => void
  onClaimed?: () => void
}) {
  const [streak, setStreak] = useState(() => getStreakState())
  const [claimable, setClaimable] = useState(() => canClaimToday())
  const [claimedReward, setClaimedReward] = useState<StreakDayReward | null>(null)
  const [crateOpening, setCrateOpening] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStreak(getStreakState())
      setClaimable(canClaimToday())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClaim = () => {
    const res = claimDailyStreak()
    if (res.success) {
      setStreak(getStreakState())
      setClaimable(false)
      setClaimedReward(res.reward)

      if (res.day === 7 || res.day === 14) {
        setCrateOpening(true)
        synth.gachaReveal('legendary')
        setTimeout(() => setCrateOpening(false), 2400)
      } else {
        synth.fanfare()
      }

      onClaimed?.()
    }
  }

  const targetDay = claimable
    ? (streak.currentDay >= 14 ? 1 : streak.currentDay + (streak.lastClaimDate ? 1 : 0))
    : streak.currentDay

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-gold/40 bg-[#0c0817] p-5 text-white shadow-[0_0_50px_rgba(255,210,74,0.15)]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-[32px]">🚀</div>
          <h2 className="display text-[26px] text-gold">14-Day Cosmic Voyage Streak</h2>
          <p className="mt-1 text-[12px] text-white/70">
            Dock every 24 hours to collect fuel, cosmic stardust, and solar kit boosters!
          </p>
        </div>

        {/* 14-Day Grid (Two 7-day weeks) */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
              Week 1 · Inner Orbit
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {STREAK_REWARDS.slice(0, 7).map((r) => {
                const isToday = r.day === targetDay
                const isCompleted = r.day < streak.currentDay || (!claimable && r.day <= streak.currentDay)
                const isCrate = r.day === 7

                return (
                  <div
                    key={r.day}
                    className={`relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all ${
                      isCrate
                        ? 'col-span-2 bg-gradient-to-br from-magenta/25 to-gold/25 border-magenta/40 sm:col-span-1'
                        : 'bg-white/5'
                    } ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : isToday && claimable
                          ? 'animate-pulse border-gold bg-gold/15 shadow-[0_0_20px_#ffd24a55]'
                          : 'border-white/10 opacity-75'
                    }`}
                  >
                    <div className="text-[10px] font-bold tracking-wider text-white/60">{r.label}</div>
                    <div className={`my-0.5 ${isCrate ? 'text-[26px]' : 'text-[20px]'}`}>
                      {isCompleted ? '✅' : r.icon}
                    </div>
                    <div className="text-[9px] font-semibold text-gold leading-tight">{r.rewardText}</div>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-magenta">
              Week 2 · Deep Nebula
            </p>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
              {STREAK_REWARDS.slice(7, 14).map((r) => {
                const isToday = r.day === targetDay
                const isCompleted = r.day < streak.currentDay || (!claimable && r.day <= streak.currentDay)
                const isGrandVault = r.day === 14

                return (
                  <div
                    key={r.day}
                    className={`relative flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all ${
                      isGrandVault
                        ? 'col-span-2 bg-gradient-to-br from-gold/30 via-magenta/30 to-purple-950 border-gold/60 sm:col-span-1'
                        : 'bg-white/5'
                    } ${
                      isCompleted
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : isToday && claimable
                          ? 'animate-pulse border-gold bg-gold/15 shadow-[0_0_20px_#ffd24a55]'
                          : 'border-white/10 opacity-75'
                    }`}
                  >
                    <div className="text-[10px] font-bold tracking-wider text-white/60">{r.label}</div>
                    <div className={`my-0.5 ${isGrandVault ? 'text-[28px]' : 'text-[20px]'}`}>
                      {isCompleted ? '✅' : r.icon}
                    </div>
                    <div className="text-[9px] font-semibold text-gold leading-tight">{r.rewardText}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Claim Action */}
        <div className="mt-5">
          {claimable ? (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-[15px] font-bold text-black shadow-[0_0_25px_#ffd24a66] transition-transform active:scale-95"
            >
              Claim Day {targetDay} Reward! 🎁
            </button>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 py-3 text-center text-[13px] text-white/60">
              ✓ Day {streak.currentDay} reward claimed. Next fuel drop arrives tomorrow!
            </div>
          )}
        </div>

        {/* Crate Animation Overlay */}
        {crateOpening && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/95 p-6 text-center animate-fade-in z-20">
            <div className="text-[64px] animate-bounce">
              {streak.currentDay === 14 ? '👑' : '🎁'}
            </div>
            <h3 className="display text-[26px] text-gold">
              {streak.currentDay === 14 ? 'SUPERNOVA GRAND VAULT OPENED!' : 'UNPACKING COSMIC CRATE!'}
            </h3>
            <p className="mt-2 text-[14px] text-cyan-200">
              {streak.currentDay === 14
                ? 'Full Life Refill, +600 Coins, +150 Stardust, 5x Flares, 4x Hammers, 3x Gravity Wells, 2x Remixes!'
                : '+350 Coins, +80 Stardust, 2x Solar Flares, 2x Hammers, 1x Gravity Well!'}
            </p>
          </div>
        )}

        {claimedReward && !crateOpening && (
          <div className="mt-3 rounded-xl border border-gold/30 bg-gold/10 p-2.5 text-center text-[12px] text-gold">
            🎉 Successfully received: <strong>{claimedReward.rewardText}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

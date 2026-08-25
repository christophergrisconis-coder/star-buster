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

      if (res.day === 7) {
        setCrateOpening(true)
        synth.gachaReveal('legendary')
        setTimeout(() => setCrateOpening(false), 2200)
      } else {
        synth.fanfare()
      }

      onClaimed?.()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-gold/40 bg-[#0c0817] p-6 text-white shadow-[0_0_50px_rgba(255,210,74,0.15)]">
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
          <h2 className="display text-[26px] text-gold">Daily Orbit Streak</h2>
          <p className="mt-1 text-[13px] text-white/70">
            Dock every 24 hours to collect fuel, cosmic stardust, and solar kit boosters!
          </p>
        </div>

        {/* 7-Day Grid */}
        <div className="mt-6 grid grid-cols-4 gap-2">
          {STREAK_REWARDS.map((r, i) => {
            const isToday = r.day === (claimable ? (streak.currentDay === 7 ? 1 : streak.currentDay + (streak.lastClaimDate ? 1 : 0)) : streak.currentDay)
            const isCompleted = r.day < streak.currentDay || (!claimable && r.day <= streak.currentDay)
            const isCrate = r.day === 7

            return (
              <div
                key={r.day}
                className={`relative flex flex-col items-center justify-between rounded-2xl border p-2.5 text-center transition-all ${
                  isCrate ? 'col-span-2 bg-gradient-to-br from-magenta/20 to-gold/20' : 'bg-white/5'
                } ${
                  isCompleted
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                    : isToday && claimable
                      ? 'animate-pulse border-gold bg-gold/15 shadow-[0_0_20px_#ffd24a55]'
                      : 'border-white/10 opacity-70'
                }`}
              >
                <div className="text-[11px] font-bold tracking-widest text-white/60">{r.label}</div>
                <div className={`my-1 ${isCrate ? 'text-[32px]' : 'text-[24px]'}`}>
                  {isCompleted ? '✅' : r.icon}
                </div>
                <div className="text-[10px] font-medium text-gold">{r.rewardText}</div>
              </div>
            )
          })}
        </div>

        {/* Claim Action */}
        <div className="mt-6">
          {claimable ? (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-[15px] font-bold text-black shadow-[0_0_25px_#ffd24a66] transition-transform active:scale-95"
            >
              Claim Today's Reward! 🎁
            </button>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/5 py-3 text-center text-[13px] text-white/60">
              ✓ Today's orbit reward claimed. Next fuel drop arrives tomorrow!
            </div>
          )}
        </div>

        {/* Crate Animation Overlay */}
        {crateOpening && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/90 p-6 text-center animate-fade-in">
            <div className="text-[64px] animate-bounce">🎁</div>
            <h3 className="display text-[26px] text-gold">UNPACKING COSMIC CRATE!</h3>
            <p className="mt-2 text-[14px] text-cyan-200">
              +250 Coins, +50 Stardust, 2x Solar Flares, 2x Hammers, 1x Gravity Well!
            </p>
          </div>
        )}

        {claimedReward && !crateOpening && (
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-center text-[13px] text-gold">
            🎉 Successfully received: <strong>{claimedReward.rewardText}</strong>
          </div>
        )}
      </div>
    </div>
  )
}

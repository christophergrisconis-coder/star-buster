import { grantCoins, grantItem, getProgress } from '~/lib/progress'

export interface StreakDayReward {
  day: number
  label: string
  icon: string
  rewardText: string
  grant: () => void
}

export const STREAK_REWARDS: StreakDayReward[] = [
  {
    day: 1,
    label: 'Day 1',
    icon: '🪙',
    rewardText: '+50 Coins',
    grant: () => {
      grantCoins(50)
    },
  },
  {
    day: 2,
    label: 'Day 2',
    icon: '✨',
    rewardText: '+15 Stardust',
    grant: () => {
      const inv = JSON.parse(localStorage.getItem('star-buster-inventory') || '{}')
      inv.stardust = (inv.stardust || 0) + 15
      localStorage.setItem('star-buster-inventory', JSON.stringify(inv))
    },
  },
  {
    day: 3,
    label: 'Day 3',
    icon: '💥',
    rewardText: '1x Solar Flare',
    grant: () => {
      grantItem('solar-flare', 1)
    },
  },
  {
    day: 4,
    label: 'Day 4',
    icon: '🪙',
    rewardText: '+120 Coins',
    grant: () => {
      grantCoins(120)
    },
  },
  {
    day: 5,
    label: 'Day 5',
    icon: '🎨',
    rewardText: '1x Color Splash',
    grant: () => {
      grantItem('color-splash', 1)
    },
  },
  {
    day: 6,
    label: 'Day 6',
    icon: '🔨',
    rewardText: '1x Cosmic Hammer',
    grant: () => {
      grantItem('hammer', 1)
    },
  },
  {
    day: 7,
    label: 'Day 7',
    icon: '🎁',
    rewardText: 'Cosmic Mystery Crate',
    grant: () => {
      grantCoins(250)
      grantItem('solar-flare', 2)
      grantItem('hammer', 2)
      grantItem('gravity-well', 1)
      const inv = JSON.parse(localStorage.getItem('star-buster-inventory') || '{}')
      inv.stardust = (inv.stardust || 0) + 50
      localStorage.setItem('star-buster-inventory', JSON.stringify(inv))
    },
  },
]

const STREAK_KEY = 'star-buster-daily-streak'

export interface StreakState {
  currentDay: number // 1 to 7
  lastClaimDate: string // YYYY-MM-DD
  totalClaims: number
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getYesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getStreakState(): StreakState {
  if (typeof window === 'undefined') return { currentDay: 1, lastClaimDate: '', totalClaims: 0 }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return { currentDay: 1, lastClaimDate: '', totalClaims: 0 }
    return JSON.parse(raw) as StreakState
  } catch {
    return { currentDay: 1, lastClaimDate: '', totalClaims: 0 }
  }
}

export function canClaimToday(): boolean {
  const state = getStreakState()
  const today = getTodayString()
  return state.lastClaimDate !== today
}

export function claimDailyStreak(): { success: boolean; day: number; reward: StreakDayReward; error?: string } {
  if (!canClaimToday()) {
    return { success: false, day: 1, reward: STREAK_REWARDS[0]!, error: 'Already claimed today!' }
  }

  const state = getStreakState()
  const today = getTodayString()
  const yesterday = getYesterdayString()

  let nextDay = state.currentDay
  if (state.lastClaimDate === yesterday) {
    // Continued streak!
    nextDay = state.currentDay >= 7 ? 1 : state.currentDay + 1
  } else if (!state.lastClaimDate) {
    // First time
    nextDay = 1
  } else {
    // Broken streak, resets to day 1
    nextDay = 1
  }

  const reward = STREAK_REWARDS.find((r) => r.day === nextDay) || STREAK_REWARDS[0]!
  reward.grant()

  const newState: StreakState = {
    currentDay: nextDay,
    lastClaimDate: today,
    totalClaims: (state.totalClaims || 0) + 1,
  }

  localStorage.setItem(STREAK_KEY, JSON.stringify(newState))
  return { success: true, day: nextDay, reward }
}

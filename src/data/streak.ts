import { accountStorageKey, grantCoins, grantItem, grantStardust, getInventory, saveInventory, getProgress } from '~/lib/progress'

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
    rewardText: '+75 Coins & Drift',
    grant: () => {
      grantCoins(75)
      grantItem('moves-5', 1)
    },
  },
  {
    day: 2,
    label: 'Day 2',
    icon: '✨',
    rewardText: '+25 Stardust',
    grant: () => {
      grantStardust(25)
    },
  },
  {
    day: 3,
    label: 'Day 3',
    icon: '💥',
    rewardText: '2x Solar Flares',
    grant: () => {
      grantItem('solar-flare', 2)
    },
  },
  {
    day: 4,
    label: 'Day 4',
    icon: '🪙',
    rewardText: '+200 Coins',
    grant: () => {
      grantCoins(200)
    },
  },
  {
    day: 5,
    label: 'Day 5',
    icon: '🎨',
    rewardText: '2x Splash & Hammer',
    grant: () => {
      grantItem('color-splash', 2)
      grantItem('hammer', 1)
    },
  },
  {
    day: 6,
    label: 'Day 6',
    icon: '🔨',
    rewardText: '2x Hammers + 35 Dust',
    grant: () => {
      grantItem('hammer', 2)
      grantStardust(35)
    },
  },
  {
    day: 7,
    label: 'Day 7',
    icon: '🎁',
    rewardText: 'Cosmic Mystery Crate',
    grant: () => {
      grantCoins(350)
      grantItem('solar-flare', 2)
      grantItem('hammer', 2)
      grantItem('gravity-well', 1)
      grantStardust(80)
    },
  },
  {
    day: 8,
    label: 'Day 8',
    icon: '🚀',
    rewardText: '3x Extra Drift (+5)',
    grant: () => {
      grantItem('moves-5', 3)
      grantCoins(150)
    },
  },
  {
    day: 9,
    label: 'Day 9',
    icon: '⏳',
    rewardText: '2x Deep Clocks (+35s)',
    grant: () => {
      grantItem('orbit-time-deep', 2)
    },
  },
  {
    day: 10,
    label: 'Day 10',
    icon: '🌀',
    rewardText: '2x Gravity Wells',
    grant: () => {
      grantItem('gravity-well', 2)
      grantCoins(250)
    },
  },
  {
    day: 11,
    label: 'Day 11',
    icon: '🎨',
    rewardText: '3x Color Splash + 60 Dust',
    grant: () => {
      grantItem('color-splash', 3)
      grantStardust(60)
    },
  },
  {
    day: 12,
    label: 'Day 12',
    icon: '🛡️',
    rewardText: '3x Shields & 2x Remix',
    grant: () => {
      grantItem('ion-wake-shield', 3)
      grantItem('star-shuffle', 2)
    },
  },
  {
    day: 13,
    label: 'Day 13',
    icon: '☄️',
    rewardText: '5x Flares & 3x Hammers',
    grant: () => {
      grantItem('solar-flare', 5)
      grantItem('hammer', 3)
    },
  },
  {
    day: 14,
    label: 'Day 14',
    icon: '👑',
    rewardText: 'Supernova Grand Vault',
    grant: () => {
      grantCoins(600)
      grantItem('solar-flare', 5)
      grantItem('hammer', 4)
      grantItem('gravity-well', 3)
      grantItem('star-shuffle', 2)
      grantItem('moves-5', 4)
      grantStardust(150)
      const inv = getInventory()
      inv.lives = Math.max(inv.lives, 8)
      saveInventory(inv)
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
    const raw = localStorage.getItem(accountStorageKey(STREAK_KEY))
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
    nextDay = state.currentDay >= 14 ? 1 : state.currentDay + 1
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

  localStorage.setItem(accountStorageKey(STREAK_KEY), JSON.stringify(newState))
  return { success: true, day: nextDay, reward }
}

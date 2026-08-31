import { useEffect, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { UniverseBackground } from '~/fx/universeBackground'
import { WarpOverlay } from '~/fx/warpBurst'
import { RiveMotionLayer } from '~/fx/RiveMotionLayer'
import { LivesPips } from './LivesPips'
import { MuteButton } from './MuteButton'
import { Tabs } from './Tabs'
import { hydrateOwnerAccess, useIsCoAdmin } from '~/lib/owner'
import { applyLifeRegen, getInventory } from '~/lib/progress'
import { DailyPilotGreetings } from './DailyPilotGreetings'

export function ThemeToggle() {
  const toggle = () => {
    document.documentElement.classList.toggle('light')
    localStorage.setItem(
      'sb-theme',
      document.documentElement.classList.contains('light') ? 'light' : 'dark',
    )
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark"
      className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-white/10 text-gold"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="3.4" />
        <path
          d="M12 3.6v1.8M12 18.6v1.8M3.6 12h1.8M18.6 12h1.8M6.1 6.1l1.3 1.3M16.6 16.6l1.3 1.3M17.9 6.1l-1.3 1.3M7.4 16.6l-1.3 1.3"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const isCoAdmin = useIsCoAdmin()
  useEffect(() => {
    hydrateOwnerAccess()
    applyLifeRegen()
  }, [])
  return (
    <>
      <UniverseBackground />
      <WarpOverlay />
      <RiveMotionLayer />
      <div className={`app-frame relative z-10 mx-auto flex min-h-dvh max-w-[430px] flex-col pb-10${isCoAdmin ? ' app-frame--coadmin' : ''}`}>
        <header className="relative z-20 flex items-center justify-between px-3 pt-3">
          <Link to="/" className="display text-[17px] tracking-[0.04em] text-gold">
            {isCoAdmin ? 'Anaclara’s Star Buster' : 'Star Buster'}
          </Link>
          <div className="flex items-center gap-1.5">
            <LivesPips lives={typeof window === 'undefined' ? 5 : getInventory().lives} compact />
            <MuteButton />
            <ThemeToggle />
          </div>
        </header>
        {isCoAdmin ? <p className="coadmin-sigil">Co-admin constellation · private pilot bay</p> : null}
        <Tabs />
        <div className="app-main relative z-10 min-h-0 flex-1">{children}</div>
      </div>
      <DailyPilotGreetings />
    </>
  )
}

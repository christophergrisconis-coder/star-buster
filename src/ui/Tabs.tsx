import { Link, useRouterState } from '@tanstack/react-router'
import { PlayCta } from './PlayCta'

const TABS = [
  {
    to: '/',
    label: 'Map',
    match: (p: string) => p === '/' || p.startsWith('/nebula') || p.startsWith('/system'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.2 6.2l1.6 1.6M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/challenges',
    label: 'Quest',
    match: (p: string) => p.startsWith('/challenges'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 4.5h8.5a2 2 0 012 2V20l-6.2-2.6L5.1 20V6.5a2 2 0 012-2z" strokeLinejoin="round" />
        <path d="M9 9h6M9 12.5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/store',
    label: 'Shop',
    match: (p: string) => p.startsWith('/store') || p.startsWith('/lucky-draw'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M5 8.5h14l-1.1 10.2a2 2 0 01-2 1.8H8.1a2 2 0 01-2-1.8L5 8.5z" strokeLinejoin="round" />
        <path d="M8.5 8.5V7a3.5 3.5 0 017 0v1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/leaderboard',
    label: 'Rank',
    match: (p: string) => p.startsWith('/leaderboard'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6.5 19V12M12 19V6.5M17.5 19v-4.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Pilot',
    match: (p: string) => p.startsWith('/profile') || p.startsWith('/friends'),
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="8.2" r="2.6" />
        <path d="M6.2 18.5c.8-3.1 2.8-4.6 5.8-4.6s5 1.5 5.8 4.6" strokeLinecap="round" />
      </svg>
    ),
  },
] as const

export function Tabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const playing = pathname.startsWith('/play')
  return (
    <nav className="chrome-nav sticky top-0 z-40">
      <div className="mx-auto flex max-w-[430px] items-stretch gap-1 px-1.5">
        {TABS.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className="tab-fx relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-gold"
              data-active={active}
            >
              <span className="mote left-1 top-1" />
              {tab.icon}
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{tab.label}</span>
            </Link>
          )
        })}
      </div>
      {playing ? null : (
        <div className="mx-auto max-w-[430px] px-2">
          <PlayCta />
        </div>
      )}
    </nav>
  )
}

export function TabBar() {
  return <Tabs />
}

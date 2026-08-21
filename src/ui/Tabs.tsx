import { Link, useRouterState } from '@tanstack/react-router'

const TABS = [
  { to: '/', label: 'Map' },
  { to: '/play/1', label: 'Play' },
  { to: '/store', label: 'Store' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' },
] as const

export function Tabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-void/80 px-2 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-[375px] items-center justify-between gap-1">
        {TABS.map((tab) => {
          const active =
            tab.to === '/'
              ? pathname === '/'
              : pathname === tab.to || pathname.startsWith(tab.to.split('/').slice(0, 2).join('/'))
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className="tab-fx relative flex-1 rounded-full px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gold"
              data-active={active}
            >
              <span className="mote left-1 top-1" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

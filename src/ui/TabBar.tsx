import { Link, useRouterState } from '@tanstack/react-router'

const TABS = [
  { to: '/', label: 'Map' },
  { to: '/play/1', label: 'Play' },
  { to: '/store', label: 'Store' },
  { to: '/leaderboard', label: 'Board' },
  { to: '/profile', label: 'Pilot' },
] as const

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-space-950/80 px-2 py-2 backdrop-blur-md">
      <div className="mx-auto flex max-w-[375px] items-center gap-1">
        {TABS.map((tab) => {
          const active =
            tab.to === '/'
              ? pathname === '/' || pathname.startsWith('/nebula') || pathname.startsWith('/system')
              : pathname.startsWith(tab.to.replace(/\/\d+$/, '')) || pathname === tab.to
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={`tab-fx press-burst relative flex-1 rounded-full px-1 py-2 text-center text-[11px] font-semibold tracking-wide ${
                active ? 'bg-accent text-white shadow-[0_0_18px_#ff2bd6aa]' : 'bg-white/5 text-white/70'
              }`}
            >
              <span>{tab.label}</span>
              <span className="absolute right-2 top-1 h-1 w-1 rounded-full bg-gold opacity-80" />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

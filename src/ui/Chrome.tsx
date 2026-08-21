export function HeaderChrome({
  dark,
  muted,
  onToggleTheme,
  onToggleMute,
}: {
  dark: boolean
  muted: boolean
  onToggleTheme: () => void
  onToggleMute: () => void
}) {
  return (
    <header className="mx-auto flex max-w-[375px] items-center justify-between px-4 py-3">
      <div>
        <p className="font-display text-[10px] uppercase tracking-[0.35em] text-gold">Deep orbit</p>
        <h1 className="font-display text-2xl leading-none">STAR BUSTER</h1>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onToggleMute}
          className="press-burst rounded-full bg-white/10 px-3 py-2 text-xs"
        >
          {muted ? 'Audio off' : 'Audio on'}
        </button>
        <button
          type="button"
          onClick={onToggleTheme}
          className="press-burst rounded-full bg-white/10 px-3 py-2 text-xs"
        >
          {dark ? 'Dark' : 'Light'}
        </button>
      </div>
    </header>
  )
}

export function MapSkeleton() {
  return (
    <div className="mx-auto grid max-w-[375px] gap-4 px-4 py-6">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <svg viewBox="0 0 48 48" className="h-12 w-12 animate-pulse">
            <circle cx="24" cy="24" r="16" fill="#ff2bd622" stroke="#ffd24a55" />
            <circle cx="24" cy="24" r="6" fill="#ffd24a44" />
          </svg>
          <div className="h-4 flex-1 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-[375px] space-y-4 px-4 py-6">
      <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-white/10" />
      <div className="h-4 rounded-full bg-white/10" />
      <div className="h-24 rounded-2xl bg-white/5" />
    </div>
  )
}

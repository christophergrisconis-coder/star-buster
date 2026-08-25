export function NextOrbit({
  title,
  score,
  nextName,
  shareHref,
  onJump,
}: {
  title: string
  score: number
  nextName: string
  shareHref?: string
  onJump: () => void
}) {
  return (
    <div className="next-orbit">
      <button type="button" className="next-orbit-jump" onClick={onJump} aria-label={`Jump to ${nextName}`}>
        <span className="next-orbit-veil" />
        <span className="warp-ring" />
        <span className="warp-ring warp-ring-delay" />
        <span className="warp-core" />
        <span className="shooting-star" />
        <span className="shooting-star shooting-star-b" />
        <span className="shooting-star shooting-star-c" />
        <div className="next-orbit-copy">
          <p className="display text-[34px] leading-none text-gold">{title}</p>
          <p className="mt-2 text-[13px] uppercase tracking-[0.22em] text-white/60">score {score}</p>
          <p className="display mt-5 text-[22px] text-magenta">Next orbit</p>
          <p className="mt-1 text-[15px] text-gold">{nextName}</p>
          <p className="mt-4 text-[11px] uppercase tracking-widest text-white/45">Tap to jump</p>
        </div>
      </button>
      {shareHref ? (
        <button
          type="button"
          className="next-orbit-share"
          onClick={async (e) => {
            e.stopPropagation()
            try {
              await navigator.clipboard.writeText(shareHref)
            } catch {
              /* ignore */
            }
          }}
        >
          Copy share link
        </button>
      ) : null}
    </div>
  )
}

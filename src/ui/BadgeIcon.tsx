/**
 * Gold-line SVG glyphs replacing raw OS emoji across the meta UI
 * (streak rewards, badges, milestones). Falls back to the emoji text
 * for anything unmapped so data files never break the render.
 */
export function BadgeIcon({
  icon,
  className = 'h-6 w-6',
  color = '#ffd24a',
}: {
  icon: string
  className?: string
  color?: string
}) {
  const glyph = GLYPHS[icon]
  if (!glyph) return <span aria-hidden>{icon}</span>
  return (
    <svg viewBox="0 0 32 32" className={className} fill={color} stroke={color} aria-hidden>
      {glyph}
    </svg>
  )
}

const GLYPHS: Record<string, React.ReactNode> = {
  // coin
  '🪙': (
    <>
      <circle cx="16" cy="16" r="11" fill="none" strokeWidth="2.2" />
      <path d="M16 9.5v13M12 12.7h6.5a2.4 2.4 0 010 4.8h-5a2.4 2.4 0 000 4.8H20" fill="none" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // stardust sparkle
  '✨': (
    <>
      <path d="M16 4l2.2 7.2L25.5 13l-7.3 1.8L16 22l-2.2-7.2L6.5 13l7.3-1.8z" strokeWidth="0" />
      <path d="M25 21l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" strokeWidth="0" />
      <path d="M7 22l.8 2.4 2.4.8-2.4.8L7 28.4l-.8-2.4-2.4-.8 2.4-.8z" strokeWidth="0" />
    </>
  ),
  // burst
  '💥': (
    <path d="M16 3l3 7 7-4-3 7 7 3-7 3 3 7-7-4-3 7-3-7-7 4 3-7-7-3 7-3-3-7 7 4z" strokeWidth="0" />
  ),
  // skin palette
  '🎨': (
    <>
      <path
        d="M16 4a12 12 0 100 24c2 0 2.6-1.3 2-2.6-.8-1.7 0-3.4 2-3.4h2.6A5.4 5.4 0 0028 16.6 12.5 12.5 0 0016 4z"
        fill="none"
        strokeWidth="2.2"
      />
      <circle cx="11" cy="11.5" r="1.8" strokeWidth="0" />
      <circle cx="18" cy="9.5" r="1.8" strokeWidth="0" />
      <circle cx="9.5" cy="18" r="1.8" strokeWidth="0" />
    </>
  ),
  // hammer
  '🔨': (
    <path d="M20.2 4.6 27 11.4l-3.2 3.2-1.7-1.7-9.6 9.6c-.7.7-1.9.8-2.7.2l-.8.8-2.2-2.2.8-.8c-.6-.8-.5-2 .2-2.7l9.6-9.6-1.7-1.7 3.2-3.2Z" strokeWidth="0" />
  ),
  // gift crate
  '🎁': (
    <>
      <rect x="5" y="12" width="22" height="15" rx="2" fill="none" strokeWidth="2.2" />
      <path d="M16 12v15M5 18h22" fill="none" strokeWidth="2" />
      <path d="M16 12c-3-.5-6.5-2-6.5-4.4C9.5 5.8 11 5 12.4 5c2.3 0 3.6 3.4 3.6 7zm0 0c3-.5 6.5-2 6.5-4.4C22.5 5.8 21 5 19.6 5 17.3 5 16 8.4 16 12z" fill="none" strokeWidth="2" />
    </>
  ),
  // rocket
  '🚀': (
    <>
      <path
        d="M16 3.5c4.4 2.6 6.5 7.6 6.5 12.4l3 4.4-4 .6a10 10 0 01-11 0l-4-.6 3-4.4c0-4.8 2.1-9.8 6.5-12.4z"
        fill="none"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="13" r="2.6" fill="none" strokeWidth="2" />
      <path d="M13 25.5 16 29l3-3.5" fill="none" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // hourglass
  '⏳': (
    <path
      d="M9 4h14M9 28h14M10.5 4c0 5 3 7.5 5.5 9.5S21.5 17 21.5 22v6h-11v-6c0-5 3-6.5 5.5-8.5S10.5 9 10.5 4z"
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  // vortex
  '🌀': (
    <path
      d="M16 16m-2.5 0a2.5 2.5 0 105 0 5.5 5.5 0 10-8 4.9A9 9 0 1025 16a12 12 0 10-9 11.6"
      fill="none"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  ),
  // shield
  '🛡️': (
    <>
      <path d="M16 3.5 26 7v8c0 6.5-4.2 11-10 13.5C10.2 26 6 21.5 6 15V7z" fill="none" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="m11.5 15.5 3 3 6-6" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // comet
  '☄️': (
    <>
      <circle cx="21" cy="21" r="6" strokeWidth="0" />
      <path d="M4 6l9 7M6 13l6 5M12 4l5 8" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // crown
  '👑': (
    <path d="M5 24V11l6 4.5L16 7l5 8.5L27 11v13zm0 2.5h22V29H5z" strokeWidth="0" />
  ),
  // check
  '✅': (
    <>
      <circle cx="16" cy="16" r="12" fill="none" strokeWidth="2.4" />
      <path d="m10.5 16.5 3.6 3.6 7.4-8" fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // glowing star
  '🌟': (
    <>
      <path d="M16 4l3 8 8.5 1-6.2 5.8 1.7 8.7L16 23l-7 4.5 1.7-8.7L4.5 13l8.5-1z" strokeWidth="0" />
    </>
  ),
  // dizzy star
  '💫': (
    <>
      <path d="M13 6l2.2 5.5L21 13l-5.8 1.5L13 20l-2.2-5.5L5 13l5.8-1.5z" strokeWidth="0" />
      <path d="M18 18a6 6 0 108 6" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // sun
  '☀️': (
    <>
      <circle cx="16" cy="16" r="6" strokeWidth="0" />
      <path d="M16 2.5v4.4M16 25.1v4.4M2.5 16h4.4M25.1 16h4.4M6.5 6.5l3.1 3.1M22.4 22.4l3.1 3.1M25.5 6.5l-3.1 3.1M9.6 22.4l-3.1 3.1" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // galaxy
  '🌌': (
    <>
      <circle cx="16" cy="16" r="2.6" strokeWidth="0" />
      <path d="M16 8a8 8 0 018 8M16 24a8 8 0 01-8-8M22 6a12.5 12.5 0 014 10M10 26a12.5 12.5 0 01-4-10" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  // target
  '🎯': (
    <>
      <circle cx="16" cy="16" r="11.5" fill="none" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="6.5" fill="none" strokeWidth="2.2" />
      <circle cx="16" cy="16" r="2" strokeWidth="0" />
    </>
  ),
  // bolt
  '⚡': (
    <path d="M18 3 7 18h7l-2 11 11-15h-7z" strokeWidth="0" />
  ),
  // bloom
  '🌸': (
    <>
      <circle cx="16" cy="16" r="3.4" strokeWidth="0" />
      <path
        d="M16 4.5a4.6 4.6 0 014 7 4.6 4.6 0 016.9 4 4.6 4.6 0 01-4.3 6.6A4.6 4.6 0 0116 27.5a4.6 4.6 0 01-6.6-5.4A4.6 4.6 0 015.1 15.5a4.6 4.6 0 016.9-4 4.6 4.6 0 014-7z"
        fill="none"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </>
  ),
  // shooting star
  '🌠': (
    <>
      <path d="M21 12l1.8 4.6 4.9.6-3.6 3.4 1 4.9L21 23l-4.1 2.5 1-4.9-3.6-3.4 4.9-.6z" strokeWidth="0" />
      <path d="M3 5l10 7M5 12l7 5" fill="none" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
}

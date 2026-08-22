import type { KitSlotId } from '~/data/kit'

export function KitIcon({
  id,
  armed = false,
  className = 'h-7 w-7',
}: {
  id: KitSlotId
  armed?: boolean
  className?: string
}) {
  const stroke = armed ? '#1c140c' : '#ffd24a'
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" stroke={stroke} strokeWidth="1.6">
      {id === 'flare' ? (
        <>
          <circle cx="16" cy="16" r="5.5" fill={stroke} stroke="none" />
          <path d="M16 3 L16 8 M16 24 L16 29 M4 16 H9 M23 16 H28 M7 7 l3.2 3.2 M21.8 21.8 l3.2 3.2 M25 7 l-3.2 3.2 M7 25 l3.2-3.2" strokeLinecap="round" />
        </>
      ) : id === 'hammer' ? (
        <>
          <path d="M8 22 L20 10" strokeLinecap="round" />
          <path d="M18 8 l6 6 -3 3 -6 -6z" fill={stroke} stroke="none" />
        </>
      ) : id === 'well' ? (
        <>
          <circle cx="16" cy="16" r="8.5" />
          <circle cx="16" cy="16" r="4" />
          <path d="M16 5 v4 M16 23 v4 M5 16 h4 M23 16 h4" strokeLinecap="round" />
        </>
      ) : id === 'moves' ? (
        <path d="M8 20c8-2 10-10 16-12-4 8-2 14-8 16 2-4 0-8-8-4z" strokeLinejoin="round" />
      ) : id === 'orbit' ? (
        <circle cx="16" cy="16" r="8" strokeDasharray="3 3" />
      ) : id === 'splash' ? (
        <>
          <circle cx="16" cy="16" r="5" />
          <path d="M16 5 C22 10 22 22 16 27 C10 22 10 10 16 5" />
        </>
      ) : id === 'shield' ? (
        <path d="M16 5 l8 4 v7c0 6-3.6 9.2-8 11-4.4-1.8-8-5-8-11V9z" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M8 12 h16 M8 20 h16" strokeLinecap="round" />
          <path d="M11 9 l-3 3 3 3 M21 17 l3 3 -3 3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

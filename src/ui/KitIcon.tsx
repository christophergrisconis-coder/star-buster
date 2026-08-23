import type { KitSlotId } from '~/data/kit'

/** Same emblems used on the kit tray, shop labels, and sky drops. */
export function KitIcon({
  id,
  armed = false,
  className = 'h-7 w-7',
}: {
  id: KitSlotId
  armed?: boolean
  className?: string
}) {
  const ink = armed ? '#1c140c' : '#ffd24a'
  return (
    <svg viewBox="0 0 32 32" className={className} fill={ink} aria-hidden>
      {id === 'flare' ? (
        <>
          <circle cx="16" cy="16" r="5.2" />
          <path d="M15.1 2.2h1.8v6.2h-1.8zm0 21.4h1.8v6.2h-1.8zM2.2 15.1h6.2v1.8H2.2zm21.4 0h6.2v1.8h-6.2z" />
          <path d="m6.1 6.1 1.3-1.3 4.4 4.4-1.3 1.3zm13.1 13.1 1.3-1.3 4.4 4.4-1.3 1.3zM24.6 4.8l1.3 1.3-4.4 4.4-1.3-1.3zM6.1 25.9l1.3 1.3 4.4-4.4-1.3-1.3z" />
        </>
      ) : id === 'hammer' ? (
        <path d="M20.2 4.6 27 11.4l-3.2 3.2-1.7-1.7-9.6 9.6c-.7.7-1.9.8-2.7.2l-.8.8-2.2-2.2.8-.8c-.6-.8-.5-2 .2-2.7l9.6-9.6-1.7-1.7 3.2-3.2Zm-8.4 16.1 8.8-8.8 1.6 1.6-8.8 8.8-.8-.8c.4-.2.6-.5.7-.8Z" />
      ) : id === 'well' ? (
        <>
          <path
            fill="none"
            stroke={ink}
            strokeWidth="2"
            d="M16 6.5a9.5 9.5 0 1 1-8.2 4.7"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="3.2" />
        </>
      ) : id === 'moves' ? (
        <path d="M7.2 24.6c2.4-5.2 6.6-8.4 12.6-9.1l-2.2-2.2 8.8-1.4-1.4 8.8-2.3-2.3c-4.2 2.2-7.2 6.6-7.8 11.4-2.6-1.8-5.3-3.4-7.7-5.2Z" />
      ) : id === 'orbit' ? (
        <>
          <circle cx="16" cy="16" r="10" fill="none" stroke={ink} strokeWidth="2" />
          <circle cx="16" cy="16" r="1.6" />
          <path d="M16 8.2v8l5.2 3.1" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : id === 'splash' ? (
        <path d="M16 4.4c4.8 5.4 8.4 10 8.4 14.2A8.4 8.4 0 1 1 7.6 18.6C7.6 14.4 11.2 9.8 16 4.4Z" />
      ) : id === 'shield' ? (
        <path d="M16 3.8 26 8.2v7.4c0 6.8-4.1 10.8-10 13.2-5.9-2.4-10-6.4-10-13.2V8.2L16 3.8Z" />
      ) : (
        <path d="M6 10.2h12.4l-2.6-2.6 1.6-1.6 5.4 5.4-5.4 5.4-1.6-1.6 2.6-2.6H6zm20 11.6H13.6l2.6 2.6-1.6 1.6-5.4-5.4 5.4-5.4 1.6 1.6-2.6 2.6H26z" />
      )}
    </svg>
  )
}

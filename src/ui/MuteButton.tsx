import { useState } from 'react'
import { useAudio } from '~/audio/useAudio'

export function MuteButton() {
  const audio = useAudio()
  const [burst, setBurst] = useState(false)

  return (
    <button
      type="button"
      aria-label={audio.muted ? 'Unmute' : 'Mute'}
      aria-pressed={audio.muted}
      data-muted={audio.muted}
      onClick={() => {
        setBurst(true)
        audio.toggle()
        window.setTimeout(() => setBurst(false), 420)
      }}
      className={`mute-btn relative grid h-9 w-9 shrink-0 place-items-center rounded-full border ${
        audio.muted
          ? 'border-magenta/70 bg-magenta/30 text-white'
          : 'border-white/20 bg-white/10 text-gold'
      }`}
    >
      {burst ? <span className="mute-burst" aria-hidden /> : null}
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" stroke="none" />
        {audio.muted ? (
          <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
        ) : (
          <>
            <path d="M16 9.5a3.2 3.2 0 010 5" strokeLinecap="round" />
            <path d="M18.2 7.5a6 6 0 010 9" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  )
}

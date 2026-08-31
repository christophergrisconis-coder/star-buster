import { useEffect, useRef, useState } from 'react'
import { useAudio } from '~/audio/useAudio'

export function MuteButton() {
  const audio = useAudio()
  const [burst, setBurst] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        aria-label="Audio settings"
        aria-expanded={open}
        data-muted={audio.muted}
        onClick={() => setOpen((v) => !v)}
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

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-56 space-y-3 rounded-2xl border border-white/15 bg-void/95 p-3 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Audio</span>
            <button
              type="button"
              aria-pressed={audio.muted}
              onClick={() => {
                setBurst(true)
                audio.toggle()
                window.setTimeout(() => setBurst(false), 420)
              }}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                audio.muted
                  ? 'border-magenta/70 bg-magenta/30 text-white'
                  : 'border-white/20 bg-white/10 text-gold'
              }`}
            >
              {audio.muted ? 'Unmute' : 'Mute all'}
            </button>
          </div>
          <label className="block space-y-1">
            <span className="flex justify-between text-[11px] text-white/70">
              <span>Star bursts (SFX)</span>
              <span>{Math.round(audio.sfxVolume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audio.sfxVolume * 100)}
              onChange={(e) => audio.setSfxVolume(Number(e.target.value) / 100)}
              className="w-full accent-[#ffd24a]"
            />
          </label>
          <label className="block space-y-1">
            <span className="flex justify-between text-[11px] text-white/70">
              <span>Cosmic ambience (music)</span>
              <span>{Math.round(audio.musicVolume * 100)}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(audio.musicVolume * 100)}
              onChange={(e) => audio.setMusicVolume(Number(e.target.value) / 100)}
              className="w-full accent-[#5ce1ff]"
            />
          </label>
        </div>
      ) : null}
    </div>
  )
}

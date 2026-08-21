import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { useAudio } from '~/audio/useAudio'
import { Tabs } from './Tabs'

export function ThemeToggle() {
  const toggle = () => {
    document.documentElement.classList.toggle('light')
    localStorage.setItem(
      'sb-theme',
      document.documentElement.classList.contains('light') ? 'light' : 'dark',
    )
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-widest"
    >
      Light / Dark
    </button>
  )
}

export function Shell({ children }: { children: ReactNode }) {
  const audio = useAudio()
  return (
    <div className="mx-auto min-h-dvh max-w-[375px] pb-8">
      <header className="flex items-center justify-between px-3 pt-3">
        <Link to="/" className="display text-[18px] text-gold">
          Star Buster
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={audio.toggle}
            className="rounded-full border border-white/20 px-2 py-1 text-[11px]"
          >
            {audio.muted ? 'Sound off' : 'Sound on'}
          </button>
          <ThemeToggle />
        </div>
      </header>
      <Tabs />
      {children}
    </div>
  )
}

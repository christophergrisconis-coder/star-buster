import { useEffect, useMemo } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useRive, useStateMachineInput } from '@rive-app/react-canvas'

const RIVE_URL = import.meta.env.VITE_RIVE_HUD_URL?.trim()
const MACHINE = 'Star Buster HUD'

function screenIndex(pathname: string) {
  if (pathname.startsWith('/play')) return 1
  if (pathname.startsWith('/challenges')) return 2
  if (pathname.startsWith('/store') || pathname.startsWith('/lucky-draw')) return 3
  if (pathname.startsWith('/profile') || pathname.startsWith('/friends')) return 4
  return 0
}

function RiveHud({ pathname }: { pathname: string }) {
  const { RiveComponent, rive } = useRive({ src: RIVE_URL!, stateMachines: MACHINE, autoplay: true })
  const section = useStateMachineInput(rive, MACHINE, 'ScreenIndex', 0)
  const enter = useStateMachineInput(rive, MACHINE, 'Enter')
  const index = useMemo(() => screenIndex(pathname), [pathname])

  useEffect(() => {
    if (section) section.value = index
    // This is visual-only: routing and interaction never wait for Rive.
    enter?.fire()
  }, [enter, index, section])

  return <RiveComponent className="rive-motion-canvas" aria-hidden />
}

/** Optional Rive shell/HUD integration with a polished no-asset fallback. */
export function RiveMotionLayer() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  if (typeof window === 'undefined' || !RIVE_URL) return <div className="rive-motion-fallback" aria-hidden />
  return <RiveHud pathname={pathname} />
}

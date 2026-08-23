import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CAMPAIGN } from '~/data/campaign'
import { requestWarpThen } from '~/fx/warpBurst'
import { isNebulaUnlocked, nebulaLevelIds, nebulaRequiredComplete } from '~/lib/lock'
import { playDestination } from '~/lib/playLabel'
import { getProgress } from '~/lib/progress'
import { hasCompletedTutorial } from '~/lib/tutorial'
import { denyEntry } from '~/ui/deny'
import { PlanetGlobe } from './PlanetGlobe'
import { VoyageSky } from './VoyageSky'
import { nebulaTheme, planetLook, schoolLook } from './planetLooks'

type PathNode = {
  key: string
  index: number
  nebulaId: string
  name: string
  sectorName: string
  sectorColor: string
  systemName: string
  look: ReturnType<typeof planetLook>
  firstLevelId: number | 'tutorial'
  orbits: number
}

function buildNodes(includeSchool: boolean): PathNode[] {
  const nodes: PathNode[] = []
  if (includeSchool) {
    nodes.push({
      key: 'school',
      index: 0,
      nebulaId: 'tutorial',
      name: 'Flight School',
      sectorName: 'Training orbit',
      sectorColor: '#c9a227',
      systemName: 'How to play',
      look: schoolLook(),
      firstLevelId: 'tutorial',
      orbits: 1,
    })
  }
  CAMPAIGN.nebulas.forEach((nebula, i) => {
    const sector = CAMPAIGN.sectors.find((s) => s.id === nebula.sectorId)
    const system = CAMPAIGN.systems.find((s) => s.id === nebula.systemId)
    const orbits = nebulaLevelIds(nebula.id)
    nodes.push({
      key: nebula.id,
      index: nodes.length,
      nebulaId: nebula.id,
      name: nebula.name,
      sectorName: sector?.name ?? 'Sector',
      sectorColor: sector?.color ?? '#6b7c8a',
      systemName: system?.name ?? '',
      look: planetLook(i + 1),
      firstLevelId: orbits[0] ?? 1,
      orbits: orbits.length,
    })
  })
  return nodes
}

function pose(depth: number, index: number) {
  const x = Math.sin(index * 1.15) * (28 + Math.min(52, Math.max(0, depth) * 22))
  const y = 132 - depth * 108
  const scale = depth < 0 ? Math.min(1.16, 1 - depth * 0.14) : Math.max(0.24, 1 - depth * 0.32)
  const opacity =
    depth > 3.25 ? 0 : depth < -2.1 ? 0 : depth < 0 ? Math.max(0.22, 1 + depth * 0.38) : 1
  return { x, y, scale, opacity: Math.max(0, Math.min(1, opacity)) }
}

export function VoyageMap() {
  const navigate = useNavigate()
  const scroller = useRef<HTMLDivElement>(null)
  const travelRef = useRef(0)
  const primed = useRef(false)
  const [step, setStep] = useState(280)
  const [dest, setDest] = useState<ReturnType<typeof playDestination> | null>(null)
  const [school, setSchool] = useState(() => typeof window === 'undefined' || !hasCompletedTutorial())
  const [travel, setTravel] = useState(0)
  const [progress, setProgress] = useState(() =>
    typeof window === 'undefined' ? { levels: {}, guest: true } : getProgress(),
  )

  useEffect(() => {
    const refresh = () => {
      setDest(playDestination())
      setSchool(!hasCompletedTutorial())
      setProgress(getProgress())
    }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    document.body.classList.add('voyage-live')
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      document.body.classList.remove('voyage-live')
    }
  }, [])

  const nodes = useMemo(() => buildNodes(school), [school])
  const startKey = school ? 'school' : dest?.nebulaId ?? CAMPAIGN.nebulas[0]?.id ?? 'school'
  const index = Math.max(0, Math.min(nodes.length - 1, Math.round(travel)))
  const current = nodes[index] ?? nodes[0]

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const view = Math.min(el.clientHeight || 0, window.innerHeight || 800)
      setStep(Math.max(240, Math.min(380, Math.round(view * 0.7))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    if (!primed.current) {
      const start = nodes.find((n) => n.key === startKey)
      if (!start) return
      primed.current = true
      el.scrollTop = start.index * step
      travelRef.current = start.index
      setTravel(start.index)
      return
    }
    el.scrollTop = travelRef.current * step
  }, [startKey, nodes, step])

  const visible = useMemo(() => {
    const from = Math.max(0, Math.floor(travel) - 3)
    const to = Math.min(nodes.length - 1, Math.ceil(travel) + 3)
    return nodes.slice(from, to + 1)
  }, [nodes, travel])

  const open = current
    ? current.firstLevelId === 'tutorial' || isNebulaUnlocked(current.nebulaId, progress)
    : false
  const done = current && current.firstLevelId !== 'tutorial' && nebulaRequiredComplete(current.nebulaId, progress)
  const cleared =
    current && current.firstLevelId !== 'tutorial'
      ? nebulaLevelIds(current.nebulaId).filter((id) => progress.levels[id]?.completed).length
      : 0
  const hereTheme = nebulaTheme(current?.nebulaId ?? 'void', current?.sectorColor)
  const ahead = nodes[Math.min(nodes.length - 1, Math.ceil(travel))]
  const mix = ahead && ahead.nebulaId !== current?.nebulaId ? travel - Math.floor(travel) : 0

  const jump = (node: PathNode, allowed: boolean) => {
    if (node.index !== index) {
      scroller.current?.scrollTo({ top: node.index * step, behavior: 'smooth' })
      return
    }
    if (!allowed) return
    requestWarpThen(() => {
      if (node.firstLevelId === 'tutorial') {
        void navigate({
          to: '/play/$levelId',
          params: { levelId: 'tutorial' },
          search: { challenge: undefined },
        })
        return
      }
      void navigate({ to: '/nebula/$nebulaId', params: { nebulaId: node.nebulaId } })
    })
  }

  return (
    <div className="voyage-shell">
      <VoyageSky travelRef={travelRef} />
      <div className="pov-nebula" aria-hidden>
        <span className="voyage-drift voyage-drift-a" style={{ background: hereTheme.mist, opacity: 0.16 }} />
        <span className="voyage-drift voyage-drift-b" style={{ background: hereTheme.bloom, opacity: 0.1 + mix * 0.12 }} />
      </div>

      <header className="pov-hud">
        <div className="pov-masthead">
          <p className="pov-kicker">The Voyage · {current?.systemName}</p>
          <h1 className="pov-title">{current?.name}</h1>
          <span className="pov-rule" />
          <p className="pov-deck">
            {current?.firstLevelId === 'tutorial'
              ? 'Training'
              : `${current?.sectorName} · ${cleared} / ${current?.orbits ?? 0} orbits`}
          </p>
        </div>
        <p className="pov-folio">{index + 1} / {nodes.length}</p>
      </header>

      <div
        ref={scroller}
        className="pov-scroller"
        onScroll={(e) => {
          const next = Math.max(0, Math.min(nodes.length - 1, e.currentTarget.scrollTop / step))
          travelRef.current = next
          setTravel(next)
        }}
      >
        <div className="pov-sticky">
          <div className="pov-camera">
            {visible.map((node) => {
              const depth = node.index - travel
              const p = pose(depth, node.index)
              if (p.opacity <= 0.02) return null
              const can =
                node.firstLevelId === 'tutorial' || isNebulaUnlocked(node.nebulaId, progress)
              const here = Math.abs(depth) < 0.45
              return (
                <button
                  key={node.key}
                  type="button"
                  className={`pov-world${here ? ' pov-world--here' : ''}`}
                  aria-label={node.name}
                  style={{
                    transform: `translate3d(calc(-50% + ${p.x}px), ${p.y}px, 0) scale(${p.scale})`,
                    opacity: p.opacity,
                    zIndex: Math.round(50 - depth * 8),
                  }}
                  onClick={() => {
                    if (!can && node.index === index) {
                      denyEntry(document.body)
                      return
                    }
                    jump(node, can)
                  }}
                >
                  <PlanetGlobe look={node.look} locked={!can} lit={here} />
                </button>
              )
            })}
          </div>
        </div>
        <div className="pov-rail" style={{ height: Math.max(step, (nodes.length - 1) * step) }} />
      </div>

      {current ? (
        <footer className="pov-dock">
          <p className="pov-status">
            {!open
              ? 'Sealed'
              : done
                ? 'Surveyed'
                : current.firstLevelId === 'tutorial'
                  ? 'Begin here'
                  : 'In range'}
          </p>
          <button
            type="button"
            className="pov-enter"
            disabled={!open}
            onClick={() => jump(current, open)}
          >
            {current.firstLevelId === 'tutorial'
              ? 'Open Flight School'
              : open
                ? 'Open this nebula'
                : 'Nebula sealed'}
          </button>
        </footer>
      ) : null}
    </div>
  )
}

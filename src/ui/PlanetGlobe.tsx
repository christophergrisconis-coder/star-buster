import type { PlanetLook } from './planetLooks'

export function PlanetGlobe({
  look,
  size = 'hero',
  locked = false,
  lit = false,
}: {
  look: PlanetLook
  size?: 'hero' | 'thumb'
  locked?: boolean
  lit?: boolean
}) {
  return (
    <div
      className={`globe globe--${size} globe--${look.kind}${locked ? ' globe--locked' : ''}${lit ? ' globe--lit' : ''}`}
      style={{
        ['--globe-glow' as string]: look.glow,
        ['--globe-spin' as string]: `${look.spin}s`,
      }}
      aria-hidden
    >
      <span className="globe-halo" />
      <div className="globe-stage">
        <img src={look.src} alt="" className="globe-photo" draggable={false} />
        <span className="globe-limb" />
        <span className="globe-shine" />
      </div>
    </div>
  )
}

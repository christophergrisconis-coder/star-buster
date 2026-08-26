import { KIT_SLOTS, kitItemIds, type KitSlotId } from '~/data/kit'
import { countItems, isAdminPilot } from '~/lib/progress'
import { isCoAdminPilot } from '~/lib/owner'
import { KitIcon } from './KitIcon'

export type BoosterId = KitSlotId
export type ArmedBooster = Extract<KitSlotId, 'flare' | 'hammer' | 'well' | 'splash'>
export type InstantBooster = Extract<KitSlotId, 'moves' | 'orbit' | 'shield' | 'shuffle'>

export function BoosterTray({
  armed,
  onArm,
  onInstant,
  disabled,
  lesson,
  freeHammer,
  counts,
  sector,
}: {
  armed: ArmedBooster | null
  onArm: (id: ArmedBooster) => void
  onInstant: (id: InstantBooster) => void
  disabled?: boolean
  lesson?: boolean
  freeHammer?: boolean
  counts: Record<KitSlotId, number>
  sector: number
}) {
  return (
    <div className={`booster-tray ${lesson ? 'lesson-focus' : ''}`}>
      <p className="px-1 text-[10px] uppercase tracking-[0.2em] text-white/45">Solar kit</p>
      <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
        {KIT_SLOTS.map((item) => {
          const locked = !isAdminPilot() && !isCoAdminPilot() && sector < item.minSector
          const owned = item.id === 'hammer' && freeHammer ? Math.max(1, counts[item.id]) : counts[item.id]
          const isArmed = armed === item.id
          const empty = !locked && owned <= 0
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked || empty}
              title={
                locked
                  ? `Unlocks in sector ${item.minSector}`
                  : empty
                    ? `Earn a drop or buy ${item.label} in the Star Market`
                    : item.blurb
              }
              onClick={() => {
                if (disabled || locked || empty) return
                if (item.use === 'instant') {
                  onInstant(item.id as InstantBooster)
                  return
                }
                onArm(item.id as ArmedBooster)
              }}
              className={`booster-slot ${isArmed ? 'booster-slot--armed' : ''} ${empty ? 'booster-slot--empty' : ''} ${locked ? 'booster-slot--locked' : ''}`}
            >
              <KitIcon id={item.id} armed={isArmed} />
              <span className="booster-slot-label">{item.label}</span>
              <span className="booster-slot-count">{locked ? `S${item.minSector}` : owned}</span>
            </button>
          )
        })}
      </div>
      {armed ? (
        <p className="px-1 text-[11px] text-gold">Armed — tap a star to fire, or tap the kit again to cancel.</p>
      ) : (
        <p className="px-1 text-[10px] text-white/40">Earn kit logos from rare sky drops or buy them in the shop.</p>
      )}
    </div>
  )
}

export function readKitCounts(): Record<KitSlotId, number> {
  const counts = {} as Record<KitSlotId, number>
  for (const slot of KIT_SLOTS) {
    counts[slot.id] = countItems(kitItemIds(slot))
  }
  return counts
}

import { kitLabelForItem, KIT_SLOTS, kitItemIds, type KitSlotId } from '~/data/kit'
import { KitIcon } from './KitIcon'

export interface ActivePickup {
  key: number
  item: string
  index: number
}

function slotIdForItem(item: string): KitSlotId {
  return KIT_SLOTS.find((s) => kitItemIds(s).includes(item))?.id ?? 'flare'
}

export function KitPickup({
  pickup,
  width,
  height,
  onCollect,
}: {
  pickup: ActivePickup
  width: number
  height: number
  onCollect: () => void
}) {
  const x = pickup.index % width
  const y = Math.floor(pickup.index / width)
  const id = slotIdForItem(pickup.item)
  return (
    <button
      type="button"
      className="kit-pickup"
      style={{
        left: `${((x + 0.5) / width) * 100}%`,
        top: `${((y + 0.5) / height) * 100}%`,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onCollect()
      }}
      aria-label={`Collect ${kitLabelForItem(pickup.item)}`}
    >
      <KitIcon id={id} className="h-8 w-8" />
      <span>{kitLabelForItem(pickup.item)}</span>
    </button>
  )
}

import { STORE_CATALOG, type StoreItem } from '~/data/store'
import { useEffect, useMemo, useState } from 'react'
import { getInventory, purchase } from '~/lib/progress'
import { synth } from '~/audio/synth'
import { KitIcon } from './KitIcon'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'boost', label: 'Boost' },
  { id: 'risk', label: 'Risk' },
  { id: 'lives', label: 'Lives' },
  { id: 'skins', label: 'Skins' },
] as const

type FilterId = (typeof FILTERS)[number]['id']

function matches(item: StoreItem, filter: FilterId) {
  if (item.hidden) return false
  if (filter === 'all') return true
  if (filter === 'lives') return item.kind === 'lives'
  if (filter === 'skins') return item.kind === 'skin'
  if (filter === 'risk') {
    return (
      item.kind === 'challenge-reroll' ||
      item.kind === 'nebula-skip' ||
      item.kind === 'ion-wake-shield' ||
      item.kind === 'orbit-time'
    )
  }
  return (
    item.kind === 'striped' ||
    item.kind === 'wrapped' ||
    item.kind === 'color-bomb' ||
    item.kind === 'hammer' ||
    item.kind === 'color-splash' ||
    item.kind === 'bundle' ||
    item.kind === 'moves' ||
    item.kind === 'nebula-booster'
  )
}

export function StoreGrid({ sector }: { sector: number }) {
  const [inv, setInv] = useState(() => ({ items: {} as Record<string, number>, skin: 'nova-gold', sector }))
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterId>('all')

  useEffect(() => {
    const live = getInventory()
    setInv({ items: live.items, skin: live.skin, sector: Math.max(sector, live.sector) })
  }, [sector])

  const items = useMemo(() => STORE_CATALOG.filter((item) => matches(item, filter)), [filter])
  const unlockedSector = Math.max(sector, inv.sector)

  return (
    <div className="grid gap-3">
      <p className="text-[12px] text-white/55">
        Kit charges are earned from rare sky drops or bought here. Later sectors unlock stronger tools.
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${
              filter === f.id ? 'bg-gold text-void' : 'border border-white/15 text-white/70'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {items.map((item) => {
        const gated = unlockedSector < item.minSector
        const owned =
          item.kind === 'skin'
            ? inv.skin === item.payload
              ? 1
              : 0
            : item.grants
              ? Object.keys(item.grants).reduce((n, id) => n + (inv.items[id] ?? 0), 0)
              : (inv.items[item.id] ?? 0)
        return (
          <button
            key={item.id}
            type="button"
            disabled={gated}
            onClick={() => {
              setPreview(item.id)
              const res = purchase(item)
              setErr(res.error ?? null)
              if (!res.error) synth.fanfare()
              else synth.invalid()
              const live = getInventory()
              setInv({ items: live.items, skin: live.skin, sector: Math.max(sector, live.sector) })
              window.setTimeout(() => setPreview(null), 700)
            }}
            className="store-card relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 text-left disabled:opacity-40"
          >
            {preview === item.id ? <span className="purchase-nova" /> : null}
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-3">
                {item.kit ? (
                  <span className="kit-store-mark">
                    <KitIcon id={item.kit} />
                  </span>
                ) : null}
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-magenta">{item.kind.replace('-', ' ')}</p>
                  <h3 className="display text-[20px] text-gold">{item.name}</h3>
                  <p className="text-[12px] text-white/70">{item.blurb}</p>
                  {gated ? (
                    <p className="mt-1 text-[11px] text-magenta">Unlocks in sector {item.minSector}</p>
                  ) : null}
                </div>
              </div>
              <div className="text-right text-[12px]">
                <div className="text-gold">
                  {item.price} {item.currency}
                </div>
                <div className="text-white/40">{item.kind === 'skin' ? (owned ? 'equipped' : 'locked in') : `owned ${owned}`}</div>
              </div>
            </div>
          </button>
        )
      })}
      {items.length === 0 ? <p className="text-[13px] text-white/50">Nothing on this frequency.</p> : null}
      {err ? <p className="text-[12px] text-red-300">{err}</p> : null}
    </div>
  )
}

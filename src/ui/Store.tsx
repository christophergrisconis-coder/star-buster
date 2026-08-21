import { STORE_CATALOG } from '~/data/store'
import { useState } from 'react'
import { getInventory, purchase } from '~/lib/progress'

export function StoreGrid({ sector }: { sector: number }) {
  const [inv, setInv] = useState(getInventory)
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="grid gap-3">
      {STORE_CATALOG.map((item) => {
        const gated = sector < item.minSector
        return (
          <button
            key={item.id}
            type="button"
            disabled={gated}
            onClick={() => {
              setPreview(item.preview)
              const res = purchase(item)
              setErr(res.error ?? null)
              setInv(getInventory())
              window.setTimeout(() => setPreview(null), 700)
            }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3 text-left disabled:opacity-40"
          >
            {preview === item.preview ? (
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,43,214,.45),transparent_55%)]" />
            ) : null}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="display text-[20px] text-gold">{item.name}</h3>
                <p className="text-[12px] text-white/70">{item.blurb}</p>
                {gated ? (
                  <p className="mt-1 text-[11px] text-magenta">Unlocks in sector {item.minSector}</p>
                ) : null}
              </div>
              <div className="text-right text-[12px]">
                <div className="text-gold">
                  {item.price} {item.currency}
                </div>
                <div className="text-white/40">owned {inv.items[item.id] ?? 0}</div>
              </div>
            </div>
          </button>
        )
      })}
      {err ? <p className="text-[12px] text-red-300">{err}</p> : null}
    </div>
  )
}

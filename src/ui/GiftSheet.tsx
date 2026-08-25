import { useEffect, useState } from 'react'
import { giftPayload, isGiftable } from '~/data/gifts'
import type { StoreItem } from '~/data/store'
import { dispatchItemGift, dispatchLifeGift } from '~/lib/crewCloud'
import { getLocalFriends } from '~/lib/progress'
import { supabaseConfigured } from '~/lib/supabase/client'
import { listFriends } from '~/server/friends'

export function GiftSheet({
  item,
  onClose,
}: {
  item: StoreItem | { id: 'life'; name: string }
  onClose: (note: string | null) => void
}) {
  const cloud = supabaseConfigured()
  const [crew, setCrew] = useState(() => getLocalFriends())
  useEffect(() => {
    if (!cloud) {
      setCrew(getLocalFriends())
      return
    }
    void listFriends()
      .then((listed) => {
        const accepted = listed.friends.filter((f) => !f.pending)
        if (accepted.length) {
          setCrew(
            accepted.map((f) => ({
              displayName: f.displayName,
              lastNebula: f.lastNebula,
              lastActive: f.lastActive,
              avatar: f.displayName[0] ?? '?',
            })),
          )
        } else setCrew(getLocalFriends())
      })
      .catch(() => setCrew(getLocalFriends()))
  }, [cloud])
  const giftable = item.id === 'life' || isGiftable(item as StoreItem)
  if (!giftable) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/50 p-4" onClick={() => onClose(null)}>
      <div
        className="w-full max-w-[430px] rounded-2xl border border-white/15 bg-[#120c18] p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[11px] uppercase tracking-widest text-gold">Send {item.name}</p>
        {crew.length === 0 ? (
          <p className="mt-2 text-[13px] text-white/60">Add a wingmate first.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {crew.map((f) => (
              <li key={f.displayName}>
                <button
                  type="button"
                  className="w-full rounded-xl bg-white/5 px-3 py-2 text-left text-[13px]"
                  onClick={() => {
                    void (async () => {
                      const payload = item.id === 'life' ? null : giftPayload(item as StoreItem)
                      const res =
                        item.id === 'life'
                          ? await dispatchLifeGift(f.displayName, cloud)
                          : payload
                            ? await dispatchItemGift(f.displayName, payload, cloud)
                            : { error: 'Not giftable' }
                      onClose(res.error ?? `Sent to ${f.displayName}`)
                    })()
                  }}
                >
                  {f.displayName}
                  <span className="block text-[11px] text-white/45">{f.lastNebula}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="mt-3 w-full text-[12px] text-white/50" onClick={() => onClose(null)}>
          Cancel
        </button>
      </div>
    </div>
  )
}

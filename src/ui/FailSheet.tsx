import { CONTINUE_COIN_COST, CONTINUE_MOVES, LIFE_MAX } from '~/data/gifts'
import { consumeItem, getInventory, spendCoins, spendLife } from '~/lib/progress'

export function FailSheet({
  reason,
  how,
  lives,
  onContinue,
  onRetry,
  onAbandon,
}: {
  reason: string
  how: string
  lives: number
  onContinue: () => void
  onRetry: () => void
  onAbandon: () => void
}) {
  const inv = typeof window === 'undefined' ? { coins: 0 } : getInventory()
  const canFuel = inv.coins >= CONTINUE_COIN_COST || (inv as ReturnType<typeof getInventory>).items?.['moves-5']
  const liveInv = typeof window === 'undefined' ? { coins: 0, items: {} as Record<string, number> } : getInventory()

  return (
    <div className="rounded-2xl border border-red-400/40 bg-black/40 p-3 text-center">
      <p className="display text-[24px]">Drift failed</p>
      <p className="mt-1 text-[13px] text-white/70">{reason}</p>
      <p className="mt-2 text-[13px] text-gold">{how}</p>
      <p className="mt-1 text-[12px] text-white/55">
        Buy +{CONTINUE_MOVES} moves to keep this board, retry (spend a pulse), or abandon.
      </p>
      <div className="mt-3 grid gap-2">
        <button
          type="button"
          className="rounded-full bg-gold py-2 text-[13px] font-semibold text-void disabled:opacity-40"
          disabled={!canFuel}
          onClick={() => {
            if (consumeItem('moves-5') || spendCoins(CONTINUE_COIN_COST)) onContinue()
          }}
        >
          +{CONTINUE_MOVES} moves · {liveInv.items['moves-5'] ? 'use fuel' : `${CONTINUE_COIN_COST} coins`}
        </button>
        <button
          type="button"
          className="rounded-full border border-gold/40 py-2 text-[13px] text-gold disabled:opacity-40"
          disabled={lives <= 0}
          onClick={() => {
            if (spendLife()) onRetry()
          }}
        >
          Retry · spend 1 pulse ({lives}/{LIFE_MAX})
        </button>
        <button
          type="button"
          className="text-[12px] text-white/60"
          onClick={() => {
            spendLife()
            onAbandon()
          }}
        >
          Abandon orbit
        </button>
      </div>
    </div>
  )
}

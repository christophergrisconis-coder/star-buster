import { useState, useCallback } from 'react'
import {
  DRAW_COST,
  RARITY_COLORS,
  claimFreeDraw,
  dailyFreeDrawAvailable,
  drawPrize,
  isMegaPack,
  megaPackItems,
  type GachaPrize,
  type GachaRarity,
} from '~/data/gacha'
import { getInventory, grantCoins, grantItem, grantLives, spendStardust } from '~/lib/progress'
import { synth } from '~/audio/synth'

const HISTORY_KEY = 'star-buster-gacha-history'

function loadHistory(): GachaPrize[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function saveHistory(list: GachaPrize[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 50)))
}

function grantPrize(prize: GachaPrize) {
  if (isMegaPack(prize)) {
    for (const { itemId, quantity } of megaPackItems()) grantItem(itemId, quantity)
    return
  }
  switch (prize.kind) {
    case 'item':
      if (prize.itemId) grantItem(prize.itemId, prize.quantity)
      break
    case 'coins':
      grantCoins(prize.quantity)
      break
    case 'stardust':
      grantCoins(0)
      const inv = getInventory()
      inv.stardust += prize.quantity
      localStorage.setItem('star-buster-inventory', JSON.stringify(inv))
      break
    case 'lives':
      grantLives(prize.quantity)
      break
    case 'skin':
      break
  }
}

function rarityLabel(r: GachaRarity) {
  return r.charAt(0).toUpperCase() + r.slice(1)
}

export function LuckyDraw() {
  const [revealing, setRevealing] = useState(false)
  const [prize, setPrize] = useState<GachaPrize | null>(null)
  const [history, setHistory] = useState(loadHistory)
  const [freeDraw, setFreeDraw] = useState(dailyFreeDrawAvailable)
  const inv = typeof window === 'undefined' ? { stardust: 0 } : getInventory()
  const canAfford = inv.stardust >= DRAW_COST || freeDraw

  const draw = useCallback((free: boolean) => {
    if (revealing) return
    if (!free) {
      const result = spendStardust(DRAW_COST)
      if (result?.error) return
    } else {
      claimFreeDraw()
      setFreeDraw(false)
    }
    setRevealing(true)
    setPrize(null)

    const seed = (Date.now() ^ (Math.random() * 0x7fffffff)) | 0
    const { prize: won } = drawPrize(seed)

    setTimeout(() => {
      setPrize(won)
      grantPrize(won)
      synth.gachaReveal(won.rarity)
      const next = [won, ...history]
      setHistory(next)
      saveHistory(next)
      setRevealing(false)
    }, 800)
  }, [revealing, history])

  return (
    <div className="space-y-4">
      <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
        <div
          className={`gacha-card ${revealing ? 'gacha-flip' : ''} ${prize ? 'gacha-landed' : ''}`}
          style={{
            ['--rarity-glow' as string]: prize ? RARITY_COLORS[prize.rarity] : '#ffd24a',
          }}
        >
          {prize ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: RARITY_COLORS[prize.rarity] }}
              >
                {rarityLabel(prize.rarity)}
              </span>
              <span className="text-[18px] font-bold text-white">{prize.name}</span>
            </div>
          ) : (
            <span className="text-[40px]">✦</span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {freeDraw ? (
          <button
            type="button"
            className="flex-1 rounded-full bg-magenta py-2.5 text-[14px] font-bold text-white"
            onClick={() => draw(true)}
            disabled={revealing}
          >
            Free Daily Draw
          </button>
        ) : null}
        <button
          type="button"
          className="flex-1 rounded-full bg-gold py-2.5 text-[14px] font-bold text-void disabled:opacity-40"
          onClick={() => draw(false)}
          disabled={!canAfford || revealing || freeDraw}
        >
          Draw · {DRAW_COST} ✦
        </button>
      </div>

      {history.length > 0 ? (
        <div className="space-y-1">
          <h2 className="text-[14px] font-semibold text-white/80">Recent draws</h2>
          <ul className="space-y-1">
            {history.slice(0, 10).map((p, i) => (
              <li
                key={`${p.id}-${i}`}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-[12px]"
              >
                <span className="text-white/90">{p.name}</span>
                <span
                  className="text-[10px] font-bold uppercase"
                  style={{ color: RARITY_COLORS[p.rarity] }}
                >
                  {p.rarity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

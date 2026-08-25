import { useEffect, useState } from 'react'
import { LivesPips } from './LivesPips'
import { getInventory } from '~/lib/progress'

const EMPTY = { coins: 0, stardust: 0, lives: 0, sector: 1 }

export function WalletBar({ compact = false }: { compact?: boolean }) {
  const [inv, setInv] = useState(EMPTY)

  useEffect(() => {
    setInv(getInventory())
  }, [])

  const chips = [
    { label: 'coins', value: inv.coins, tone: 'gold' },
    { label: 'dust', value: inv.stardust, tone: 'cyan' },
    { label: 'lives', value: inv.lives, tone: 'rose' },
  ] as const

  return (
    <div className={`wallet-bar ${compact ? 'wallet-bar--compact' : ''}`}>
      {chips.map((chip) =>
        chip.label === 'lives' ? (
          <span key={chip.label} className="wallet-chip wallet-chip--rose">
            <LivesPips lives={inv.lives} compact />
            <span className="wallet-chip-label">lives</span>
          </span>
        ) : (
          <span key={chip.label} className={`wallet-chip wallet-chip--${chip.tone}`}>
            <span className="wallet-chip-value">{chip.value}</span>
            <span className="wallet-chip-label">{chip.label}</span>
          </span>
        ),
      )}
      {!compact ? <span className="wallet-chip wallet-chip--mute">sector {inv.sector}</span> : null}
    </div>
  )
}

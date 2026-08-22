import { createFileRoute } from '@tanstack/react-router'
import { StoreGrid } from '~/ui/Store'
import { WalletBar } from '~/ui/WalletBar'
import { getInventory } from '~/lib/progress'

export const Route = createFileRoute('/store')({
  component: StorePage,
})

function StorePage() {
  const inv = typeof window === 'undefined' ? { sector: 1, coins: 0, stardust: 0 } : getInventory()
  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="display text-[28px] text-gold">Star Market</h1>
      <p className="text-[13px] text-white/70">Spend coins and stardust. Sector gates stay honest.</p>
      <WalletBar />
      <StoreGrid sector={inv.sector} />
    </div>
  )
}

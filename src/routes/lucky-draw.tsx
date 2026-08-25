import { createFileRoute } from '@tanstack/react-router'
import { LuckyDraw } from '~/ui/LuckyDraw'
import { WalletBar } from '~/ui/WalletBar'

export const Route = createFileRoute('/lucky-draw')({
  component: LuckyDrawPage,
})

function LuckyDrawPage() {
  return (
    <div className="space-y-4 px-4 pt-4">
      <h1 className="display text-[28px] text-gold">Lucky Draw</h1>
      <p className="text-[13px] text-white/70">Spend 80 stardust for a mystery prize. One free draw per day.</p>
      <WalletBar />
      <LuckyDraw />
    </div>
  )
}

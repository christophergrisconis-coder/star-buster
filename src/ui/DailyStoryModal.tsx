import type { DailyStory } from '~/data/dailyStories'
import { moodLabel } from '~/data/dailyStories'

const moodTint: Record<DailyStory['mood'], string> = {
  humble: 'border-amber-400/40 bg-[#120e08] shadow-[0_0_50px_rgba(251,191,36,0.18)]',
  shock: 'border-cyan-400/40 bg-[#061018] shadow-[0_0_50px_rgba(34,211,238,0.18)]',
  awe: 'border-violet-400/45 bg-[#0d0818] shadow-[0_0_50px_rgba(167,139,250,0.22)]',
  spark: 'border-gold/45 bg-[#120e08] shadow-[0_0_50px_rgba(255,210,74,0.18)]',
}

const moodAccent: Record<DailyStory['mood'], string> = {
  humble: 'text-amber-200',
  shock: 'text-cyan-200',
  awe: 'text-violet-200',
  spark: 'text-gold',
}

export function DailyStoryModal({
  story,
  onClose,
}: {
  story: DailyStory
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-md rounded-3xl border p-6 text-center text-white ${moodTint[story.mood]}`}>
        <div className="text-[40px]" aria-hidden>
          {story.mood === 'humble' ? '🕯️' : story.mood === 'shock' ? '⚡' : story.mood === 'awe' ? '🌌' : '✦'}
        </div>
        <div className={`mt-1 text-[11px] font-bold tracking-[0.22em] ${moodAccent[story.mood]}`}>
          DAILY {moodLabel(story.mood)} STORY
        </div>
        <h2 className={`display mt-2 text-[24px] ${moodAccent[story.mood]}`}>{story.title}</h2>
        <p className="my-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-[14px] leading-relaxed text-white/88">
          {story.body}
        </p>
        <p className="mb-5 text-[13px] font-medium italic text-gold/90">{story.reminder}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-gold via-amber-400 to-gold py-3 text-[15px] font-bold text-black shadow-[0_0_25px_#ffd24a66] transition-transform active:scale-95 hover:opacity-90"
        >
          Carry this today
        </button>
      </div>
    </div>
  )
}

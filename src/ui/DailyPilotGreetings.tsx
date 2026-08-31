import { useEffect, useState } from 'react'
import { getOwnerSession } from '~/lib/owner'
import { markDailyStoryShown, peekDailyStory, type DailyStory } from '~/data/dailyStories'
import { AnaclaraLoveModal, shouldShowAnaclaraLoveToday, takeAnaclaraLoveMessage } from './AnaclaraLoveModal'
import { DailyStoryModal } from './DailyStoryModal'

export function DailyPilotGreetings() {
  const [loveMessage, setLoveMessage] = useState<string | null>(null)
  const [story, setStory] = useState<DailyStory | null>(null)

  useEffect(() => {
    const checkGreetings = () => {
      const session = getOwnerSession()
      const isAna = session?.role === 'co-admin'
      if (isAna && shouldShowAnaclaraLoveToday()) {
        setLoveMessage(takeAnaclaraLoveMessage())
        return
      }
      const next = peekDailyStory()
      if (next) {
        markDailyStoryShown()
        setStory(next)
      }
    }

    checkGreetings()
    window.addEventListener('owner-session-changed', checkGreetings)
    return () => window.removeEventListener('owner-session-changed', checkGreetings)
  }, [])

  const afterLove = () => {
    setLoveMessage(null)
    const next = peekDailyStory()
    if (next) {
      markDailyStoryShown()
      setStory(next)
    }
  }

  return (
    <>
      {loveMessage ? <AnaclaraLoveModal message={loveMessage} onClose={afterLove} /> : null}
      {story ? <DailyStoryModal story={story} onClose={() => setStory(null)} /> : null}
    </>
  )
}

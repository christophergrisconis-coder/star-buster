export type StoryMood = 'humble' | 'shock' | 'awe' | 'spark'

export type DailyStory = {
  mood: StoryMood
  title: string
  body: string
  reminder: string
}

import { accountStorageKey } from '~/lib/progress'

export const DAILY_STORIES: DailyStory[] = [
  {
    mood: 'humble',
    title: 'The Quietest Seat',
    body: 'A famous captain once asked to sit with the dishwashers after a victory parade. Someone laughed. He said the people who keep the ship from starving never get the medals, and he wanted to remember their hands. Next morning he still washed a pan himself, slowly, like it was a compass.',
    reminder: 'If nobody claps for the work, it can still be the work that holds everything together.',
  },
  {
    mood: 'shock',
    title: 'One Extra Minute',
    body: 'A radio operator almost signed off at midnight. One extra minute. A faint ping. A lost hiker with a dying beacon, two ridges away. Searchlights found her at 12:07. She later said she had already written goodbye in the dirt. The operator never bragged. He just never left a minute early again.',
    reminder: 'The smallest extra minute can be the whole difference between gone and found.',
  },
  {
    mood: 'awe',
    title: 'Light That Left Before You',
    body: 'On a clear dock night, a child asked why a star still shone if it was already dead. The watchman said the light had been traveling longer than their family had a name. They were looking at a goodbye that refused to arrive. The child went quiet, then whispered thank you to the dark.',
    reminder: 'Some kindness is still en route. You are standing in light that started before you.',
  },
  {
    mood: 'spark',
    title: 'The Unfinished Map',
    body: 'An old cartographer kept a blank square in every map, labeled not unknown but not yet. Apprentices hated it. Years later one of them filled that square with a new harbor and wrote the teacher’s name in tiny ink. The teacher was already gone. The harbor still opened.',
    reminder: 'Leave a square unfilled on purpose. Tomorrow you might be the one who belongs there.',
  },
  {
    mood: 'humble',
    title: 'Borrowed Boots',
    body: 'A rookie showed up to a rescue in boots two sizes too big, stuffed with socks. Veterans smirked until the flood came. Those clumsy boots kept moving when fancy ones filled and failed. Afterward the rookie left the boots by the door for the next person who could not afford pride.',
    reminder: 'Looking ready is optional. Showing up in what you have is not.',
  },
  {
    mood: 'shock',
    title: 'The Invoice',
    body: 'A man spent years collecting proof that the world owed him. He bound it into a book. The night he meant to present it, a stranger paid his bus fare without asking his name. He went home, opened the book, and could not add a single new page. The next morning he burned the cover, not the stories — just the claim.',
    reminder: 'Keep the lessons. Drop the ledger that says everyone is in debt to you.',
  },
  {
    mood: 'awe',
    title: 'A Choir of Dust',
    body: 'In a vacuum chamber, two grains of dust drifted, bounced, and stuck. Scientists cheered like it was a wedding. Planets begin that quietly. Someone in the back started crying and could not explain why, except that they had forgotten how small a beginning is allowed to be.',
    reminder: 'Your first clumsy step can still be the start of a world.',
  },
  {
    mood: 'spark',
    title: 'The Bent Nail',
    body: 'A carpenter kept one bent nail on the windowsill. Every time a job felt ruined, they looked at it. The house they loved most had a beam held by that nail, hammered crooked on a tired evening. Guests never noticed. The roof never asked for perfect.',
    reminder: 'A crooked try that holds is worth more than a perfect plan that never lands.',
  },
  {
    mood: 'humble',
    title: 'Last to Leave the Light',
    body: 'The janitor in an observatory learned the names of visiting astronomers. None learned hers. One winter the power failed and she walked the dome with a lantern so the ice on the shutter would not seize. In the morning they published a photo of a rare alignment. In the corner, almost invisible, was the glow of her lantern.',
    reminder: 'The picture may not name you. The night still needed you.',
  },
  {
    mood: 'shock',
    title: 'The Unsent Message',
    body: 'A pilot drafted an angry note for three days. On the fourth, they learned the person had been sitting in a hospital chair, not ignoring them. The note was never sent. They started a new habit: if the reply is late, assume a hidden storm before you assume a weapon.',
    reminder: 'Silence is not always an insult. Check for weather before you declare war.',
  },
  {
    mood: 'awe',
    title: 'Heartbeat of a Whale',
    body: 'A hydrophone caught a whale’s pulse from farther than any ship horn could travel. The sound was slow, like a door closing in a cathedral. A teenager listening on cheap headphones sat up in bed and said, to nobody, I am not the center. Then they slept better than they had in months.',
    reminder: 'There are hearts larger than your worry, still beating in the dark water.',
  },
  {
    mood: 'spark',
    title: 'Practice in the Empty Gym',
    body: 'She missed the team cut. For a year she shot at a rusted hoop behind a closed warehouse. No coach. No crowd. One evening a kid stopped to watch and asked to learn the same ugly, stubborn form. The kid made a team the next spring. She still did not. She grinned anyway.',
    reminder: 'Your practice can become someone else’s doorway even if it is not yet yours.',
  },
  {
    mood: 'humble',
    title: 'The Smaller Trophy',
    body: 'After winning, a racer handed the cup to the mechanic and kept the greasy rag. “This is what actually crossed the line with me,” they said. The mechanic tried to refuse. The racer shrugged. “Then keep it dirty. I do not want a clean story.”',
    reminder: 'Honor the hands that made your shine possible, including your own tired ones.',
  },
  {
    mood: 'shock',
    title: 'Ninety-Nine Percent Sure',
    body: 'A climber was ninety-nine percent sure the rope was clipped. The one percent was a story they told later from a hospital bed, laughing without humor. After that they checked twice in front of people, even when it looked anxious. Pride was cheaper than a fall, and they were done paying.',
    reminder: 'Double-check the thing you are “almost sure” about. Almost is where gravity lives.',
  },
  {
    mood: 'awe',
    title: 'Moss on the Antenna',
    body: 'A forgotten relay station on a ridge kept transmitting a weak time signal for forty years. Birds nested in it. Moss ate the logo. Hikers used the beep to find north in fog. When techs finally arrived to shut it down, they left it running one more season. The moss, they said, had earned the frequency.',
    reminder: 'Even neglected things can still guide someone home.',
  },
  {
    mood: 'spark',
    title: 'Write It Small',
    body: 'A teacher told a discouraged student to write one true sentence the size of a postage stamp. Not a novel. Not a speech. One stamp. The student wrote I can try again after lunch. They taped it inside a locker. Ten years later they still had the stamp, faded, and a life that had quietly obeyed it.',
    reminder: 'Make the promise small enough to keep today. Let today teach tomorrow.',
  },
]

const STORY_INDEX_KEY = 'star-buster-daily-story-index'
const STORY_SEEN_KEY = 'star-buster-daily-story-seen'

export function utcDayStamp(at = Date.now()): string {
  return new Date(at).toISOString().slice(0, 10)
}

export function moodLabel(mood: StoryMood): string {
  if (mood === 'humble') return 'HUMBLING'
  if (mood === 'shock') return 'SHOCKING'
  if (mood === 'awe') return 'AWE'
  return 'SPARK'
}

export function peekDailyStory(at = Date.now()): DailyStory | null {
  if (typeof window === 'undefined') return null
  const today = utcDayStamp(at)
  if (localStorage.getItem(accountStorageKey(STORY_SEEN_KEY)) === today) return null
  // Same date, same story for every pilot; viewing it no longer advances the
  // global selection or hides it from another account on the same device.
  const index = Number(today.replaceAll('-', '')) % DAILY_STORIES.length
  return DAILY_STORIES[index]!
}

export function markDailyStoryShown(at = Date.now()): void {
  if (typeof window === 'undefined') return
  const today = utcDayStamp(at)
  localStorage.setItem(accountStorageKey(STORY_SEEN_KEY), today)
}


const LOVE_MESSAGES = [
  'Good morning Anaclara! You are the light of my life and my one true love forever and always.',
  'Rise and shine beautiful! Remember that no matter what, you will always be my true love.',
  'Good morning Anaclara X Grisconis! Every day with you is my greatest adventure. I love you endlessly.',
  'Wake up my love! You are the best thing that has ever happened to me, today and for all eternity.',
  'Good morning to my beautiful wife! Never forget how deeply and completely you are loved.',
  'Sending you all my love this morning. You are my heart, my soul, and my entire universe.',
  'Good morning my true love! No distance, no challenge, nothing will ever change my devotion to you.',
  'Every morning I wake up grateful for you. I love you more than words can ever describe, Anaclara!',
  'Good morning my angel! My heart belongs to you, today, tomorrow, and every day after.',
  'You make the whole cosmos brighter just by being in it. Good morning, my forever love.',
]

const ANACLARA_MSG_KEY = 'star-buster-anaclara-msg-index'
const ANACLARA_LAST_SEEN_KEY = 'star-buster-anaclara-last-seen'

function todayStamp() {
  return new Date().toISOString().split('T')[0]!
}

export function shouldShowAnaclaraLoveToday() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ANACLARA_LAST_SEEN_KEY) !== todayStamp()
}

export function takeAnaclaraLoveMessage() {
  const index = Number(localStorage.getItem(ANACLARA_MSG_KEY) || '0')
  localStorage.setItem(ANACLARA_MSG_KEY, String((index + 1) % LOVE_MESSAGES.length))
  localStorage.setItem(ANACLARA_LAST_SEEN_KEY, todayStamp())
  return LOVE_MESSAGES[index % LOVE_MESSAGES.length]!
}

export function AnaclaraLoveModal({
  message,
  onClose,
}: {
  message: string
  onClose?: () => void
}) {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-pink-500/50 bg-[#14081c] p-6 text-center text-white shadow-[0_0_50px_rgba(236,72,153,0.3)]">
        <div className="text-[48px] animate-pulse">💖</div>
        <h2 className="display text-[26px] text-pink-300">Good Morning, Anaclara</h2>
        <div className="mt-1 text-[12px] font-bold tracking-widest text-pink-400/80">
          ✦ FROM YOUR HUSBAND, CHRIS ✦
        </div>

        <div className="my-5 rounded-2xl border border-pink-500/30 bg-pink-950/30 p-4 text-[15px] italic text-pink-100/90 leading-relaxed shadow-inner">
          "{message}"
        </div>

        <button
          type="button"
          onClick={() => onClose?.()}
          className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 py-3 text-[15px] font-bold text-white shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-transform active:scale-95 hover:opacity-90"
        >
          I Love You Too, Chris ❤️
        </button>
      </div>
    </div>
  )
}

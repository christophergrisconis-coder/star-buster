export function MapSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: 4 }, (_, j) => (
            <svg key={j} viewBox="0 0 48 48" className="h-12 w-12 animate-pulse">
              <circle cx="24" cy="24" r="16" fill="#ffffff14" stroke="#ffd24a55" />
            </svg>
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-white/10" />
      <div className="mx-auto h-4 w-40 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
    </div>
  )
}

export function BoardSkeleton() {
  return (
    <div className="mx-auto grid w-[min(100%,360px)] grid-cols-8 gap-1 p-2">
      {Array.from({ length: 64 }, (_, i) => (
        <svg key={i} viewBox="0 0 32 32" className="aspect-square animate-pulse">
          <path
            d="M16 2 L19 12 L30 12 L21 18 L24 28 L16 22 L8 28 L11 18 L2 12 L13 12 Z"
            fill="#ffffff10"
            stroke="#ffd24a33"
          />
        </svg>
      ))}
    </div>
  )
}

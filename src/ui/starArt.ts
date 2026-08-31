import type { StarColor } from '~/engine/types'

/** Wife's custom star logos — served from /public/stars */
export const STAR_ART: Record<StarColor | 'ingredient' | 'nova' | 'gold-heart', string> = {
  gold: '/stars/gold.png',
  red: '/stars/red.png',
  green: '/stars/green.png',
  blue: '/stars/blue.png',
  purple: '/stars/purple.png',
  cyan: '/stars/cyan.png',
  ingredient: '/stars/ingredient.png',
  nova: '/stars/nova.png',
  'gold-heart': '/stars/gold-heart.png',
}

export function starArtSrc(color: StarColor | null | undefined, opts?: { ingredient?: boolean; nova?: boolean; heart?: boolean }) {
  if (opts?.nova) return STAR_ART.nova
  if (opts?.ingredient) return STAR_ART.ingredient
  if (opts?.heart || color === 'gold') return opts?.heart ? STAR_ART['gold-heart'] : STAR_ART.gold
  if (color && color in STAR_ART) return STAR_ART[color]
  return STAR_ART.gold
}

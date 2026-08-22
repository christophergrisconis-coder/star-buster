import { CAMPAIGN, LEVEL_BY_ID } from '~/data/campaign'
import { getProgress, playTarget } from './progress'

export function playDestination() {
  const progress = getProgress()
  const target = playTarget()
  const level = LEVEL_BY_ID[target.levelId]
  const system = CAMPAIGN.systems.find((s) => s.id === level?.systemId)
  const sector = CAMPAIGN.sectors.find((s) => s.id === level?.sectorId)
  const cleared = Object.values(progress.levels).filter((l) => l.completed).length
  return {
    levelId: target.levelId,
    nebulaId: target.nebulaId,
    name: level?.name ?? `Orbit ${target.levelId}`,
    system: system?.name ?? 'Helios Drift',
    sector: sector?.name ?? 'Nebula Novice',
    guest: progress.guest,
    cleared,
    total: 250,
  }
}

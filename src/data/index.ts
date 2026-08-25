import { CAMPAIGN, LEVELS } from './campaign'
export { CAMPAIGN, LEVELS, LEVEL_BY_ID, generateCampaign } from './campaign'
export { SECTORS } from './sectors'
export { STORE_CATALOG, SKINS, SKIN_FILTERS } from './store'
export type { StoreItem, StoreKind } from './store'

export function getSystem(id: string) {
  return CAMPAIGN.systems.find((s) => s.id === id)
}

export function getNebula(id: string) {
  return CAMPAIGN.nebulas.find((n) => n.id === id)
}

export function getStage(id: string) {
  return CAMPAIGN.stages.find((s) => s.id === id)
}

export function levelsInNebula(nebulaId: string) {
  return LEVELS.filter((l) => l.nebulaId === nebulaId)
}

export const TOTAL_LEVELS = LEVELS.length

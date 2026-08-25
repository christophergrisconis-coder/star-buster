import { grantItem, grantLives } from './progress'
import { sendChat, sendItemTo, sendLifeTo, undoLifeSend } from './social'
import { postCrewMessage, sendCrewGift } from '~/server/social'

export async function dispatchLifeGift(name: string, cloud: boolean): Promise<{ error?: string }> {
  const local = sendLifeTo(name, { echo: !cloud })
  if (local.error) return local
  if (!cloud) return {}
  try {
    await sendCrewGift({ data: { displayName: name, kind: 'life' } })
    return {}
  } catch (e) {
    grantLives(1)
    undoLifeSend(name)
    return { error: e instanceof Error ? e.message : 'Cloud pulse failed' }
  }
}

export async function dispatchItemGift(name: string, itemId: string, cloud: boolean): Promise<{ error?: string }> {
  const local = sendItemTo(name, itemId, { echo: !cloud })
  if (local.error) return local
  if (!cloud) return {}
  try {
    await sendCrewGift({ data: { displayName: name, kind: 'item', itemId } })
    return {}
  } catch (e) {
    grantItem(itemId, 1)
    return { error: e instanceof Error ? e.message : 'Cloud gift failed' }
  }
}

export async function dispatchChat(to: string, body: string, cloud: boolean): Promise<{ error?: string }> {
  const local = sendChat(to, body, { echo: !cloud })
  if (local.error) return local
  if (!cloud) return {}
  try {
    await postCrewMessage({ data: { displayName: to, body: body.trim().slice(0, 180) } })
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Signal failed to dock' }
  }
}

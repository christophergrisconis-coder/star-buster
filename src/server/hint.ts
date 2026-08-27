import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const lastCall = new Map<string, number>()

/** Persona fallback so the coach always answers, even with no LLM configured. */
function novaFallback(summary: string): string {
  const combo = Number(summary.match(/combo (\d+)/)?.[1] ?? 0)
  const delta = Number(summary.match(/score Δ (-?\d+)/)?.[1] ?? 0)
  const colors = summary.match(/Swap ([\w-]+) ↔ ([\w-]+)/)
  const pair = colors ? `${colors[1]} and ${colors[2]}` : 'two bright stars'
  if (combo >= 3) return `Nova grins: line up ${pair} and the whole sky chains — I count ${combo} waves from here.`
  if (delta >= 800) return `Steady, pilot. There's a ${pair} swap on the board worth a serious burst — trust your sweep.`
  if (combo >= 2) return `Nova taps the console: a ${pair} exchange sets off a double cascade. Fly it.`
  return `Nova's scanners flag a quiet ${pair} swap — small spark now, big orbit later.`
}

export const coachHint = createServerFn({ method: 'POST' })
  .validator(z.object({ summary: z.string().max(500) }))
  .handler(async ({ data }) => {
    const now = Date.now()
    const key = 'global'
    const prev = lastCall.get(key) ?? 0
    const throttled = now - prev < 2500
    if (!throttled) lastCall.set(key, now)

    const url = process.env.AI_GATEWAY_URL || 'https://api.openai.com/v1'
    const apiKey = process.env.AI_GATEWAY_KEY || process.env.OPENAI_API_KEY
    const model = process.env.AI_MODEL || 'gpt-4o-mini'
    if (!apiKey || throttled) {
      return novaFallback(data.summary)
    }

    try {
      const res = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 80,
          temperature: 0.8,
          messages: [
            {
              role: 'system',
              content:
                'You are Nova, a cool starship navigator coaching a match-3 pilot. Reply with ONE short persona sentence. Never give coordinates. Never mention other brands.',
            },
            { role: 'user', content: data.summary },
          ],
        }),
      })
      if (!res.ok) return novaFallback(data.summary)
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const line = json.choices?.[0]?.message?.content?.trim()
      if (!line) return novaFallback(data.summary)
      return line.split('\n')[0]!.slice(0, 180)
    } catch {
      return novaFallback(data.summary)
    }
  })

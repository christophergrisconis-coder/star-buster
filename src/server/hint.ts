import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const lastCall = new Map<string, number>()

export const coachHint = createServerFn({ method: 'POST' })
  .validator(z.object({ summary: z.string().max(500) }))
  .handler(async ({ data }) => {
    const now = Date.now()
    const key = 'global'
    const prev = lastCall.get(key) ?? 0
    if (now - prev < 2500) {
      throw new Error('Coach is catching her breath. Try again in a moment.')
    }
    lastCall.set(key, now)

    const url = process.env.AI_GATEWAY_URL || 'https://api.openai.com/v1'
    const apiKey = process.env.AI_GATEWAY_KEY || process.env.OPENAI_API_KEY
    const model = process.env.AI_MODEL || 'gpt-4o-mini'
    if (!apiKey) {
      throw new Error('AI coach is not configured (missing AI_GATEWAY_KEY).')
    }

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
    if (!res.ok) {
      throw new Error(`AI coach is down (${res.status}).`)
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const line = json.choices?.[0]?.message?.content?.trim()
    if (!line) throw new Error('AI coach returned silence.')
    return line.split('\n')[0]!.slice(0, 180)
  })

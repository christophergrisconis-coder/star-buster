# Star Buster

High-fidelity space match-3. Glide a nested solar-system campaign of **exactly 250 levels**, burst original superstar gems, and ride Starburst Finale cascades.

## Run

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:3000
npm test             # engine gravity / match / combo tests
npm run build        # Netlify-ready output
```

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | client + server | Lovable Cloud / Supabase project |
| `VITE_SUPABASE_ANON_KEY` / `SUPABASE_ANON_KEY` | client + server | anon key (never the service role) |
| `VITE_SITE_URL` | client | OAuth redirect origin |
| `AI_GATEWAY_URL` | server | OpenAI-compatible base (`https://api.openai.com/v1`) |
| `AI_GATEWAY_KEY` | server | coach LLM key |
| `AI_MODEL` | server | default `gpt-4o-mini` |

Do not commit `.env`. Apply SQL in the Supabase SQL editor:

`supabase/migrations/001_init.sql` then `supabase/migrations/002_friendships.sql`

### Auth providers (dashboard)

In Supabase → Authentication → Providers, enable:

- **Email** (password) — secondary in the app
- **Google**
- **Apple**
- **Azure** (this is Sign in with Microsoft)

Set the Site URL and redirect URLs to `VITE_SITE_URL` (see `.env.example`), including `http://localhost:3000` for local and your production origin. OAuth redirect lands on `/profile`.

Remember me stores the session in `localStorage`. Unchecked uses `sessionStorage`, so the session survives refresh but not a browser restart.

Enable Email/Password plus the OAuth providers above. Avatars bucket `avatars` is private with per-user folder RLS.

## Deploy (Netlify)

`netlify.toml` uses `npm run build` and publish `.output/public`. The Vite config includes `@netlify/vite-plugin` plus Nitro so TanStack Start SSR lands in that output.

## Architecture

- `src/engine` — deterministic 8×8 reducer, seeded PRNG, hole-free gravity/refill, specials, blockers, objectives, Starburst Finale
- `src/data` — 250 generated levels nested Sector → Solar system → Nebula → Stage orb → levels
- `src/hint` — web worker DFS heuristic; server LLM returns one persona sentence
- `src/audio` — zero-dependency Web Audio synth (no HTML audio tags); mute persists in `localStorage` from the header speaker
- `src/fx` + `src/ui` — universe voyage, exploding orbs, 3D CSS stars, combo banners, Play warp burst
- `src/server` — `createServerFn` writes + session cookie guard; friends search strips user UUIDs
- Guests play levels 1–3 in `localStorage` and merge on auth. Signed-in pilots follow a sequential 250-level lock (map + `/play/$levelId` `beforeLoad`).

## Campaign shape

1. Nebula Novice — 40  
2. Orbit Adept — 45  
3. Gravity Veteran — 50  
4. Supernova Elite — 55  
5. Event Horizon — 60  
**Total 250**

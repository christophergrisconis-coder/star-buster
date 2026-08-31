# Star Buster — Orbital Command Deck redesign

## What changed

- Reframed the play surface as a responsive, cinematic command deck: dedicated mission rail, central board, cleaner header, stronger information hierarchy, and mobile fallbacks.
- Replaced the missing raster board-star images with native SVG stars so tiles cannot render as broken-image icons.
- Added wave-flow choreography and intentional reactions for stars: dance, spin, tears, launch, and supernova. Reactions are keyed to actual detonated specials rather than merely spawning a special.
- Added contextual power-up callouts, distinct arm/fire audio cues, visual launch/impact treatment, and real disabled states while the board resolves.
- Added a lightweight Rive runtime shell with a documented asset slot at `public/rive/README.md`. It is opt-in through `VITE_RIVE_HUD_URL`, is hidden for reduced motion, and is deliberately not mounted per tile.
- Fixed objective clarity and board mechanics:
  - jelly / blue-glow targets are deliberately distributed in campaign and tutorial boards;
  - removed the duplicate moving glow that stacked on tiles;
  - direct power-up hits now chip frosting;
  - swirl cells act as gravity barriers;
  - weekly mode now resolves its weekly level rather than falling through to an unknown stage.
- Expanded optional per-orbit challenges from the former 1–3 pattern to a contextual 1–4 challenge slate (without impossible no-spread/no-hint prompts).
- Made map worlds more distinct with deterministic nebula-derived atmosphere, terrain bands, and crater placement on each planet.

## Accessibility and performance

- `prefers-reduced-motion` disables continuous reactions, planet drift, glows, and the optional Rive layer while retaining readable state changes.
- Board reaction state is short lived, generated in the existing board animation loop, and does not create a Rive/canvas instance per tile.

## Verification

- `npx tsc --noEmit` passes.
- `npm test -- --run` passes: 63 tests across 8 suites.
- A production-style preview was opened from a temporary local build at `http://localhost:4176/`.

## Co-admin private pilot bay

- Co-admin saves now use a separate `:ana` storage slot for campaign progress, inventory, tutorial completion, life regeneration, friends/mail/wishlist, gacha history, and daily streak rewards.
- Existing shared saves are copied once to the co-admin slot on first use. This migration is non-destructive: the primary save is left exactly where it was.
- The co-admin dock now has an account-specific rose/violet chrome, pilot-bay signature, and retains the dedicated star treatment and greeting flow.
- The account switch remains a local prototype mechanism. Before public deployment, replace the built-in role/password lists with server-side authentication and move private player data to an account-bound backend.

## Character-star pass

- Training boards now use five readable playable colors only. Cyan is reserved for objective wells, removing the misleading lone cyan tile.
- Stars have expressive faces, idle blinks, and reaction faces during match clears: dance, spin, cry, launch, and supernova.
- Match clears layer a compact character chirp beneath the existing pop/explosion score audio; special and power-up audio stays distinct.
- Anaclara's star faces include a separate heart/wink personality. Her daily love message has its own gentle chime.
- The daily motivational story now selects deterministically by UTC date, so it is universal for that day while each pilot can read it independently.

## Run locally

```bash
npm install
npm run dev
```

Use `npm test -- --run` for the suite. If Vite is run from a folder whose path contains an apostrophe, use a normal path for production builds; this is a TanStack/Vite path parsing limitation, not an application behavior issue.

# Star Buster Rive drop-in

Place the production `.riv` file in this folder (for example
`public/rive/star-buster-hud.riv`) and set `VITE_RIVE_HUD_URL=/rive/star-buster-hud.riv`.

The app automatically uses the Rive Canvas runtime when this public variable is
set. Without it, a lightweight CSS motion layer remains active, so navigation
and gameplay never depend on an animation download.

## Required artboard and state machine

- Artboard: `HUD`
- State machine: `Star Buster HUD`

| Input | Type | Purpose |
| --- | --- | --- |
| `ScreenIndex` | Number | `0` map, `1` play, `2` quest, `3` shop, `4` pilot. |
| `Enter` | Trigger | Fires after a route has changed. |

Keep all artwork within the artboard and the root transforms stable. Rive only
renders ambient/HUD response: React remains the owner of scoring, matches,
timers, rewards, navigation, and button behavior.

For a richer next pass, add data bindings for score, moves, and objective
progress to a play-screen-only artboard. Bind them from `HUD.tsx`; never drive
game state from Rive.

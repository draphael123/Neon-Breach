# Neon Breach

Neon Breach is a browser-based 3D drift racer built with Three.js and Web Audio. Link drifts across six districts, cross apex zones sideways to raise the multiplier, skim walls for risk bonuses, and drive clean sectors before banking the chain.

## Circuits

- **Midnight Circuit** — a 2.25 km neon city course with the open Glasshouse atrium, physical columns, an elevated skyway, and a moving maglev chase.
- **Solara Run** — a 1.82 km golden-hour desert course with flowing high-speed arcs, lower-grip sand, mirror fields, a broken aqueduct, mesas, dust, and a rotating solar crown.
- **Cryoline Zero** — a 1.76 km technical polar course with extended low-grip slides, glacier switchbacks, physical ice-vault pillars, aurora ribbons, snow, and a moving launch crawler.

Each circuit has its own geometry, districts, handling tune, atmosphere, color system, AI pace, minimap, local records, and authored roadside campaign art. Choose a circuit from the title screen or use `?level=midnight`, `?level=solara`, or `?level=cryoline`.

## Drift and race systems

- Hold drift and steer to snap the rear into a slide; countersteer to maintain angle. Stable countersteer increases scoring, and a settled release earns a Perfect Exit.
- Long slides trigger Drift Lock and Deep Drift awards. Lit apexes increase flow and multiplier.
- Drive cleanly after a chain to bank it. Wall, obstacle, and rival contact break the active chain.
- Near-wall slides earn Wall Kiss bonuses, and clean passes by rivals earn Thread the Needle awards. Clean districts add a smaller consistency award.
- Circuit hazards are marked on the minimap and called out before the car reaches them.
- Camera roll, speed-responsive weather, particles, skid marks, chassis load, rival drift animation, impact flashes, and optional haptics provide feedback without changing the racing line.
- Results report lap splits, best chain, perfect exits, near misses, apex links, wall kisses, contacts, and a coaching prompt for the next run.
- The fastest completed lap is recorded locally and replayed as a translucent, non-colliding ghost on later laps and runs.
- Every finish grants a circuit license. Strong rank-and-position combinations upgrade it from Bronze to Silver and Gold; three Gold licenses grant Breach Master status.
- Rivals use corner-aware lines, hazard avoidance, passing behavior, and bounded rubber-banding rather than fixed lane weaving.
- Music responds to flow and briefly ducks under collision effects so important driving feedback stays legible.

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake
- `A` / `D` or `←` / `→`: steer and countersteer
- `Shift`: initiate and hold a drift
- `Space`: handbrake rotation
- `R`: recover to the racing line with a two-second penalty
- `Esc`: pause
- Gamepad: analog left stick to steer, triggers for gas/brake, `A` / `X` / `RB` to drift, `B` for handbrake, `Y` to recover, Menu to pause

Touch devices use auto-acceleration with on-screen steering, brake, and drift controls.

## Run locally

Serve this directory with any static HTTP server, then open `index.html` through that server. ES modules will not load correctly from a `file://` URL.

For example, with Node.js and `serve` installed:

```sh
npx serve .
```

Validate every circuit's length, grade, remote-segment clearance, districts, and drift zones with:

```sh
npm run validate
```

## Architecture

- `game.js`: state, fixed-step driving physics, input, AI, scoring, HUD, and audio synthesis
- `levels.js`: the three circuit definitions, themes, handling tunes, copy, districts, and record namespaces
- `track.js`: circuit curve, sampling, districts, and drift-zone positions
- `world.js`: procedural environment, cars, track furniture, and batching
- `effects.js`: bloom, drift aberration, theme-aware weather, particles, and skid marks
- `music.js`: gapless Web Audio soundtrack loops
- `progression.js`: tested circuit-license and mastery rules

Settings and personal records are stored locally in the browser.

The Settings panel includes a sound-test mode for previewing engine, tyre, impact, race-cue, and music channels independently. Tyre tone and soundtrack treatment change by circuit surface and theme.

## Credits

“Going Undercover” and “Deadly Contracts” by Tomasz Kucza / Magnesus are licensed under CC BY 4.0. Full links are available in the in-game settings panel.

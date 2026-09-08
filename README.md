# Neon Breach

Neon Breach is a browser-based 3D drift racer built with Three.js and Web Audio. Link drifts across six districts, cross apex zones sideways to raise the multiplier, skim walls for risk bonuses, and drive clean sectors before banking the chain.

## Circuits

- **Midnight Circuit** — a 2.23 km neon city course with the open Glasshouse atrium, physical columns, an elevated skyway, and a moving maglev chase.
- **Solara Run** — a 1.82 km golden-hour desert course with flowing high-speed arcs, lower-grip sand, mirror fields, a broken aqueduct, mesas, dust, and a rotating solar crown.
- **Cryoline Zero** — a 1.76 km technical polar course with extended low-grip slides, glacier switchbacks, physical ice-vault pillars, aurora ribbons, snow, and a moving launch crawler.

Each circuit has its own geometry, districts, handling tune, atmosphere, color system, AI pace, minimap, and local records. Choose a circuit from the title screen or use `?level=midnight`, `?level=solara`, or `?level=cryoline`.

## Controls

- `W` / `↑`: accelerate
- `S` / `↓`: brake
- `A` / `D` or `←` / `→`: steer and countersteer
- `Shift`: initiate and hold a drift
- `Space`: handbrake rotation
- `R`: recover to the racing line with a two-second penalty
- `Esc`: pause
- Gamepad: left stick to steer, triggers for gas/brake, face buttons to drift

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

Settings and personal records are stored locally in the browser.

The Settings panel includes a sound-test mode for previewing engine, tyre, impact, race-cue, and music channels independently.

## Credits

“Going Undercover” and “Deadly Contracts” by Tomasz Kucza / Magnesus are licensed under CC BY 4.0. Full links are available in the in-game settings panel.

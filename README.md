# Neon Breach

Neon Breach is a browser-based 3D drift racer built with Three.js and Web Audio. Link drifts across six districts, cross apex zones sideways to raise the multiplier, skim walls for risk bonuses, and drive clean sectors before banking the chain.

Circuits use a 32 m road profile with wide drift lanes on a 34 m verge each side; signature interiors and infrastructure narrow selected sections into deliberate technical choke points. Every circuit has at least three corners tighter than the car's top-speed turning radius, so braking and drift entry are real decisions, and rivals are paced per circuit to the honest lap. Road furniture is per circuit (quay lanterns and a seawall on Floodline, a lit parapet on Skyline, sodium lamps on Blackout, ice bollards on Cryoline), and every city circuit has its own moving set piece: a patrol boat on Floodline's harbour, a cable pod over Skyline's summit, sweeping searchlights on Blackout, the maglev on Midnight, the launch crawler on Cryoline, and the solar crown on Solara.

## Circuits

- **Midnight Circuit** — a 3.71 km neon precision course with the open Glasshouse atrium, physical columns, an elevated skyway, and a moving maglev chase.
- **Floodline District** — a 3.70 km storm-city canal grid with a harbour straight, moored barges, standing-water hydroplane sectors, the floodgate, and a pumping-station hairpin.
- **Skyline Divide** — a 3.75 km switchback climb through a violet vertical city, breaking through a cloud deck to summit sky-bridges and helipads, where clean high-altitude running recharges boost before the descent.
- **Blackout Protocol** — a 3.99 km core-city grid of right-angle blocks, substation yards, and pylon cables strung over the road, with rolling grid failures and amplified overvolt boost windows.
- **Solara Run** — a 3.72 km golden-hour desert course with flowing high-speed arcs, lower-grip sand, mirror fields, a broken aqueduct, mesas, dust, and a rotating solar crown.
- **Cryoline Zero** — a 3.68 km technical polar course with extended low-grip slides, glacier switchbacks, physical ice-vault pillars, aurora ribbons, snow, and a moving launch crawler.

The opening four races form a mechanically varied city campaign; desert and polar circuits arrive later as frontier events. Each circuit has its own geometry, districts, handling tune, atmosphere, color system, AI pace, minimap, and local records. Choose a circuit from the title screen or use its `?level=` id.

## Drift and race systems

- Hold drift and steer to snap the rear into a slide; countersteer to maintain angle. Stable countersteer increases scoring, and a settled release earns a Perfect Exit.
- Long slides trigger Drift Lock and Deep Drift awards. Lit apexes increase flow and multiplier.
- Drive cleanly after a chain to bank it. Wall, obstacle, and rival contact break the active chain.
- Banking a drift chain charges a manually deployed boost capacitor: `E`, controller `LB`, or the touch BOOST control.
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
- `E`: deploy banked boost
- `R`: recover to the racing line with a two-second penalty
- `Esc`: pause
- Gamepad: analog left stick to steer, triggers for gas/brake, `A` / `X` / `RB` to drift, `LB` to boost, `B` for handbrake, `Y` to recover, Menu to pause

Touch devices use auto-acceleration with on-screen steering, brake, boost, and drift controls.

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

## Test bot and scene audit

The dev server in `tools/devserver.mjs` serves with `Cache-Control: no-store` and accepts reports:

```sh
node tools/devserver.mjs . 5845
```

- `?level=<id>&bot=all&laps=3&difficulty=normal&tag=run&chain=1` drives every profile (`clean`, `drifter`, `drifternb`, `wallrider`, `idle`) through the fixed-step sim without rendering, posts `tools/reports/<tag>-<level>-<difficulty>.json`, and walks on to the next circuit. `rubber=0` disables rival rubber-banding for calibration. `node tools/summarize.mjs <tag>` prints the matrix as a table. The sim is deterministic, so three laps per profile are enough.
- `?level=<id>&audit=1&sheet=1` snapshots every mesh before batching and reports floating geometry (nothing under or over it), buried geometry, solid geometry on the road without a collider, colliders without a mesh, and the prop vocabulary; `sheet=1` renders an eight-station contact sheet to `tools/reports/sheets/`. `node tools/audit-compare.mjs` compares track shapes and vocabularies across circuits.
- `node tools/track-check.mjs [draft]` prints length, tightest radius, brake and lift shares, grade, clearance, and the corner list per circuit; `tools/levels-draft.mjs` authors circuits as polygons with fillet radii and `tools/shapes.html` draws the six outlines.

## Bot results (normal difficulty, clean driver unless noted)

Columns: average lap / share of lap at the speed cap / braking per lap / rival lap / finish (gap to P2). Baseline is the 2026-09-08 code before the race and circuit changes; cryoline had no baseline run.

| circuit | before | after | no-boost drifter lap / wall-rider lap |
|---|---|---|---|
| midnight | 60.0 / 78% / 2.6 s / 86.0 / P1 | 60.8 / 69% / 1.6 s / 62.1 / P2 (0.6 s) | 65.1 / 61.2 |
| floodline | 59.7 / 98% / 0.0 s / 81.1 / P1 | 61.4 / 57% / 1.6 s / 62.8 / P2 (0.1 s) | 62.1 / 63.0 |
| skyline | 56.0 / 98% / 0.0 s / 77.4 / P1 | 62.7 / 37% / 3.3 s / 64.7 / P1 (-0.1 s) | 63.4 / 65.6 |
| blackout | 62.0 / 98% / 0.0 s / 84.7 / P1 | 65.7 / 41% / 2.1 s / 67.1 / P2 (0.2 s) | 66.4 / 69.7 |
| solara | 52.8 / 98% / 0.0 s / 73.2 / P1 | 58.8 / 53% / 2.3 s / 61.1 / P1 (-0.3 s) | 60.6 / 61.1 |
| cryoline | — / — / — s / — / — | 64.2 / 64% / 2.0 s / 65.4 / P2 (0.9 s) | 72.0 / 66.4 |

Rival pace is set per circuit by `aiPace` in `levels.js`, calibrated so a rival lap matches the clean bot's lap; difficulty scales it (casual 0.90, normal 0.965, expert 1.02) and the rubber band is capped at ±2.2 m/s in both directions.

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

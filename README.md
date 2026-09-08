# Neon Breach

Neon Breach is a browser-based 3D cyberpunk drift racer built with Three.js and Web Audio. Link drifts across four districts, cross apex zones sideways to raise the multiplier, and bank the chain before a collision breaks it.

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

## Architecture

- `game.js`: state, fixed-step driving physics, input, AI, scoring, HUD, and audio synthesis
- `track.js`: circuit curve, sampling, districts, and drift-zone positions
- `world.js`: procedural environment, cars, track furniture, and batching
- `effects.js`: bloom, drift aberration, rain, particles, and skid marks
- `music.js`: gapless Web Audio soundtrack loops

Settings and personal records are stored locally in the browser.

## Credits

“Going Undercover” and “Deadly Contracts” by Tomasz Kucza / Magnesus are licensed under CC BY 4.0. Full links are available in the in-game settings panel.

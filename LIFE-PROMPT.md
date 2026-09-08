# NEON BREACH — Life and identity program

Interview result (2026-09-08). Reference: **Ridge Racer corners, Mario Kart moments.** The drift is the verb, so corners
carry identity; each circuit also owns one theme-park moment per district and one gimmick pushed into a real system.
Sequence: **one axis across all six circuits at a time**, so each pass ships a comparable state everywhere.
Geometry may change anywhere, Midnight included. Split routes are **risk routes**: same length, tighter and riskier,
worth more drift score, rivals stay on the main line. Reactions wanted, in order of build: crowds that flinch, traffic
that swerves, marshals and boards that answer the race, environment that answers the drift.

## Rules that hold on every axis

- Audit stays at zero: `?audit=1` reports no unsupported, no road clip without collider, no collider without mesh.
- Bot targets stand: clean bot finishes P1 or within 2 s of P1 on normal; validator passes; frame under 8 ms on Skyline.
- Every new thing is placed by `t` on the curve, not by world coordinates, unless it is scenery beyond the verge.
- A moment has a name, a district, a trigger (place or lap), and a visible telegraph two seconds before it matters.
- Nothing new is a second copy of another circuit's thing wearing a different colour.

## Axis 1 — Route geometry (this pass)

Primitives in the sim, authored per level in `levels.js`:
- `jumps:[{t,len}]` — a ramp on the road; crossing it above 30 m/s launches the car (vy from speed and ramp angle),
  no steering while airborne, landing shake, `AIR` toast; a clean drift on landing scores.
- `banks:[{from,to,roll}]` — the road rolls into a banked bowl; grip ×1.25 inside; car and camera lean with it.
- `chokes:[{from,to,half,label}]` — wall limit narrows with drawn walls; the audit treats the zone width as the road.
- `risks:[{from,to,control,half,mult,label}]` — a second curve between two main-line t's; the player is on it when
  inside its half width; walls, y, progress and minimap follow it; drift score ×mult while on it; rivals never take it.

Per circuit, two or three features the others do not have:
- Midnight: service-alley risk route beside the market straight (half 7, ×1.6); skyway crest jump.
- Floodline: banked harbour bowl; floodgate choke; canal-bed risk route under the bridge (flood grip, ×1.5).
- Skyline: summit crest jump; rooftop risk route above the climb (×1.6); helipad chicane choke.
- Blackout: underpass choke with pillars; substation-cut risk route through the yard (×1.5); banked stadium bowl.
- Solara: two dune crest jumps; aqueduct-top risk route (high, half 6, ×1.7); canyon choke at the hairpin.
- Cryoline: crevasse risk route on glacier ice (×1.6); crawler-yard crest; ice-vault choke (exists).

Verify: bot matrix (`tag=geo`), audit chain, contact sheets, `track-check`.

Status: shipped 2026-09-08. Primitives live in track.js (`riskRoutes`, `chokeHalf`, `bankRoll`, `jumps`), game.js (airborne state, risk-route clamp and progress mapping, choke wall limit, bank grip), world.js (risk ribbons with kerb lights and piers, chevron ramps, choke walls with optional roof, banked ribbons). Bot is risk-aware. Audit zero on all six.

## Axis 2 — Moments on the lap clock
One named moment per district, 36 total; two per circuit are big scripted movers with telegraphs, four are vignettes.

## Axis 3 — Mechanics as systems
HUD gauge per circuit: heat bar, flood level, grid status, ice spread across laps, altitude draft, precision streak.
Each gauge changes a decision, not just a number.

## Axis 4 — Reactions
Crowd clusters at corners flinch and flash; verge traffic brakes and pulls aside; marshals wave yellow after contact,
green when clean; gantry boards show position and chain; spray, dust, snow, rattling posts and flickering signs answer
the drift.

## Axis 5 — Density
Fuller traffic, more crowds, drones, weather bands, animated signs, on every circuit, within the frame budget.

## Axis 6 — Landmarks and district stories
A legible silhouette at every brake corner; each district's name, look, and one happening read as a journey.

## Status 2026-09-08 — axes 2 to 6 shipped
- Axis 2: `moments.js`, 36 moments (six per circuit, two big), telegraph by distance ahead, events toast through `worldEvents`.
- Axis 3: gauges in the HUD (`#gauge`); heat, flood spread by lap, ice spread by lap, grid countdown, altitude draft, precision streak.
- Axis 4: `reactions.js`: instanced crowds that lean and flash, verge vans that pull aside and honk, marshals with yellow/green flags, canvas gantry boards, camera drones, sign flicker, surface spray while drifting.
- Axis 5: traffic arteries 40 to 44 cars each plus a fifth artery, weather bands heavier in districts 3 and 5.
- Axis 6: `landmarks.js`: one landmark per brake corner on the outside of the bend, per-circuit silhouette with a moving light (neon tower, lighthouse beam, crane strobe, cooling tower, rock arch beacon, radar dish).
- Frame: ~5 ms, 320 draw calls on Midnight. All six circuits run rendered frames with no console errors.

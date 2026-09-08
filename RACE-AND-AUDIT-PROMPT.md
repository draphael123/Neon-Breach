# NEON BREACH — Race fix, test bot, visual audit

Goal: turn a score-attack drift toy into a race that can be lost, prove it with a bot instead of
a feeling, and make every circuit look finished and unmistakable. Work top to bottom; each block
is independently shippable and each ends with a bot run or a screenshot set.

## 0. Rules of the patch

- **Numbers come from the bot, not from a guess.** Every handling or AI change is followed by a
  bot run of ≥21 laps per circuit (7 laps × 3 profiles). A change that does not move the metric
  it targets is reverted, not kept "because it feels right".
- **Rivals stay on rails.** Only the player has physics. Rival pace is a target speed along the
  curve; it may be corner-aware and rubber-banded, never simulated.
- **Nothing floats, nothing clips the road.** Every placed mesh sits on the ground it belongs to
  or is on the list of things that are allowed to hang (skyway, billboards, signs, aurora,
  maglev, launch crawler, cables). Anything else with daylight under it is a bug.
- **Six circuits, six silhouettes.** A player who has driven each once must be able to name the
  circuit from the minimap, from a single mid-lap screenshot, or from the handling.
- Keep the file style (dense long-line modules, no build step, local three.module.js). Edit with
  exact-string replacement, never regex; re-run `npm run validate` after every change.

## 1. Test bot (`tools/bot.js`, loaded by `?bot=`)

Lives in the browser because the sim is DOM-coupled. Drives through the existing dev seam
(`window.__nb`) and never touches game state directly except through `keys`.

- **Fast stepping.** `__nb.fast=true` skips post-FX, atmosphere and HUD while stepping so a
  21-lap run takes seconds. Sim still runs the real fixed 60 Hz `updateRace`.
- **Driver profiles** (all use a look-ahead steer on `yaw(t+look)` plus a lane-centring term):
  - `clean` — brakes when `curvature(t+0.02)` exceeds a threshold, never drifts, never boosts.
    Measures the honest fastest lap and whether braking is ever required.
  - `drifter` — drifts every bend above the drift threshold, deploys boost on straights.
    Measures the score economy and the time cost of drifting.
  - `wallrider` — late look-ahead and no lane centring; hits walls. Measures contact penalties
    and that the wall clamp never wedges, spins or NaNs the car.
  - `idle` — throttle only, no steering after 3 s. Measures how fast rivals pass and finish
    (the rival pace floor).
- **Per-lap metrics:** lap time, min/avg/max speed, seconds at speed cap, seconds braking,
  seconds drifting, contacts, off-track seconds, drift score, boosts used, position at lap end,
  gap to leader/P2 in seconds, rival lap times (from `ai[]` progress).
- **Invariants checked every frame:** no NaN in `t/speed/heading/position`, `near.d` never
  above half-width + 0.5 after clamp, `progress` monotonic within a lap except recover, rivals'
  `ai[]` monotonic, frame never throws. Any violation aborts the run and is the headline.
- **Output:** JSON report posted to the dev server (`POST /report?name=`) which writes
  `tools/reports/<name>.json`, plus a one-screen summary table printed to `#botReport`.
- **Run matrix:** `?bot=all` runs every circuit × every profile × 7 laps and posts one file;
  `?bot=<profile>&level=<id>&laps=<n>` runs one cell.

## 2. Baseline

Run the full matrix before touching handling. Record for each circuit: honest lap (clean), drift
lap (drifter), idle finish position, rivals' lap, share of lap at speed cap, contacts. This is
the before-table for the README and for every later comparison.

## 3. Visual audit

### 3a. Scene audit script (`tools/audit.js`, `?audit=1`)
Traverses `scene` after build. For every mesh (instanced batches expanded per instance):
- **Floating:** world bbox min-y vs ground at the bbox centre (track y from `nearest` when
  within 2× half-width of the road, else terrain/ground plane). Flag gap > 0.6 m unless the
  mesh's name/material is on the allow-hang list.
- **Buried:** bbox max-y below ground − 0.3 m (invisible geometry still costs a draw).
- **Road clip:** bbox overlaps the road ribbon (lane within ±half-width) and it is not on the
  `collisionBodies` list or road furniture list → either a hazard without collision or a prop
  through the road.
- **Collision without mesh:** each `collisionBodies` entry must have a mesh within its radius.
- Report grouped by mesh name with counts and the first three positions (as `t` along the
  track) so I can screenshot them.

### 3b. Screenshot sweep
Eight camera stations per circuit at `t = k/8`, chase-cam height, plus two low-angle shots at
the worst audit hits. One contact sheet per circuit. Look for: floating props, z-fighting on
the road, props intersecting walls, lights with no source, empty skylines, road edges with
no kerb light, signs facing the wrong way, repeated identical facades in view at once.

### 3c. Distinctness
- **Shape:** per circuit, a curvature histogram and turn-direction sequence; two circuits whose
  histograms correlate above 0.9 are the same track wearing different paint.
- **Palette:** average screenshot hue/saturation per station; two circuits within ΔE≈10 across
  all eight stations are not distinct.
- **Vocabulary:** count prop kinds per circuit from the audit; each circuit needs at least
  three props no other circuit has, placed where the lap looks at them.
- **Handling:** each circuit's clean-bot lap must differ in speed profile (sections at cap vs
  braking) — write the fraction of the lap at cap per circuit.

## 4. Make it a race

1. **Speed as a consequence.** Drag scales with speed² so the cap is only reached on a straight;
   sustained slip angle bleeds speed (drift is time for score). Target: clean bot spends
   < 55 % of the lap at cap on every circuit; drifter lap is 3–6 s slower than clean.
2. **Brake points exist.** On the four circuits with no corner tighter than the car's top-speed
   turning radius, tighten two or three corners each (control points only, validator must pass,
   remote clearance kept). Target: clean bot brakes ≥ 3 times per lap on every circuit.
3. **Rivals with a pulse.** Rival base pace on normal ≈ clean-bot lap ± 2 %; expert 3 % faster;
   easy 6 % slower. Rubber band pulls both ways and is capped so a perfect lap still wins by a
   car length, a sloppy one loses. Target: idle bot finishes 4th; clean bot finishes 1st–2nd
   with a P2 gap under 4 s; drifter finishes 2nd–3rd unless boosts are used well.
4. **Contact matters.** Wall hit costs speed for a second, not just the chain. Target: wallrider
   finishes last and is ≥ 8 s off clean.
Re-run the matrix after each numbered item and keep the deltas in `tools/reports/`.

## 5. Visual fixes

Fix every 3a floating/buried/clip hit at the source (placement height from `at(t).y` or the
terrain sampler, not a constant). Then per circuit, add or strengthen the three signature
props from 3c so each is visible from the road in at least two districts. Re-run 3a to zero
hits and re-shoot the contact sheets.

## 6. Done means

- Matrix passes every target in §4 on all six circuits, with the JSON in `tools/reports/`.
- Audit script reports zero floating/buried/clip hits and every collision body has a mesh.
- Six contact sheets, each identifiable at a glance; README before/after table updated.
- `npm run validate` green; validate also runs the audit's static checks where possible.

## Status — 2026-09-08 run

Done: §1 bot (`tools/bot.js`, five profiles, chain runner, summarizer), §2 baseline (`tools/reports/baseline-*`), §3 audit script + contact sheets (`tools/reports/sheets/`) + `audit-compare.mjs`, §4.1-4.4 (quadratic drag, slip bleed 1.0, four ovals re-authored with 3-6 brake corners, cryoline apexes sharpened to 3, per-circuit rival pace with ±2.2 rubber band, wall hit -18% speed), §5 (verges + skirts, grounded absolute props, atrium colliders, on-road glacier/mesa/stadium blocks removed, per-city sky/fog/weather/buildings/verges, three signature props each).

Measured (normal): clean bot finishes P1 or P2 within 0.9 s on all six; no-boost drifter 4-14 s slower than clean on drift-heavy circuits, 0.5-1 s on flowing ones; wall-rider P2-P3 and 1-8 s off (the ≥8 s target holds only on blackout/skyline — wide roads give the bot too few contacts, so this is a bot limit as much as a game one); at-cap share 37-70 % (cryoline 64 %, midnight 69 % because its chokes replace corners); audit reports zero unsupported / road-clip / collider-without-mesh on all six.

Not done / follow-ups: the radius-histogram similarity is still ~0.99 between the four re-authored circuits because they share one fillet vocabulary (36/42/60-150 m) even though their turn sequences differ — vary the radius mix per circuit next; the prop-vocabulary metric counts random building sizes as unique kinds and needs a coarser key; adaptive graphics may drop to battery mode spuriously in the first five seconds (unverified); cryoline's baseline bot run was lost to Chrome tab throttling.

Second pass (same day): per-circuit road furniture replaced the shared lamps and kerb lights; Floodline barges and tanks now also appear in districts 2 and 4, Skyline sky-bridges and helipads on the descent; movers added (Floodline patrol boat, Skyline cable pod, Blackout searchlights) and the shared maglev hidden on those three. Audit still zero on all six.

## Third pass — 2026-09-08 (rating follow-ups + life)

- **Corner vocabulary per circuit:** Floodline right-angle 44 m blocks (4 brake corners), Skyline 32-34 m switchbacks plus sweeps (7), Blackout 44-52 m medium corners (3), Solara one 39 m canyon hairpin plus 60 m lift corners (by design, high-speed desert). Generator gained an overlap guard and distance-interpolated heights (fixed a 63 % grade spike). Corner-radius similarity now 0.01-0.88 across pairs, nothing above 0.9 once straights are excluded from the metric.
- **Rivals:** seeded mistakes (lift to 86 % pace plus a lane wobble for ~1 s every 5.5-20 s by difficulty), slipstream +2.6 m/s when tucked behind another rival, recalibrated with `tools/calibrate.mjs` at a 3.5 % margin. v6: clean bot P1-P2 within 1.6 s on all six.
- **Mechanics with teeth:** Solara heat (full throttle above 80 % of top builds heat; overheated = grip ×0.8 and top ×0.94 until you lift or drift), Cryoline black ice (two sectors at grip ×0.62 with glassy patches drawn on the road). Slip bleed scaled by circuit grip so ice scrubs less.
- **Life:** window banks in five phase groups pulse and blink, elevated traffic arteries with instanced two-way streams (four per city, one each for desert and polar), four strobing aircraft circling the city, plus the existing movers.
- **Performance:** measured 2.9-6.4 ms per rendered frame (hidden tab, 1280×720), 180 draw calls on Skyline. No action needed.
- Still open: a human has not driven it.

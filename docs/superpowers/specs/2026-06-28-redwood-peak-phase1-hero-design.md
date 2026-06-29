# Redwood Peak — Phase 1: Landing Page Hero — Design Spec

**Date:** 2026-06-28 · **Revised:** 2026-06-29 (Revision 2)
**Status:** Revision 2 — corrected composition; **re-approval pending** before resuming implementation.
**Scope:** Phase 1 of 7 only. Each phase gets its own spec → plan → implementation cycle. Phases 2–7
are out of scope except where Phase 1 must leave seams for them.

---

## 0. Revision 2 — what changed and why

Revision 1 was built and reviewed in a real browser. The render revealed that the composition was
wrong and surfaced three bugs. This revision corrects the **orientation of the whole scene** and the
interaction model that depends on it. The underlying engine (glass material, procedural geometry, PEAK
tagging/registry, GSAP rise timelines, audio scheduler, quality tiers, design tokens) is **unchanged** —
this is a camera/orientation/art-direction rework in the scene layer, not a rebuild.

**Headline change:** the hero is no longer a side-on "aquarium looking into the tank's depth." It is a
**top-down bird's-eye view looking straight down onto the surface of a body of water**, with small
bottles and syringes floating at/near that surface.

**Scope decision (R2):** the original side-on **submerged view and the scroll-driven dive into it are
deferred to Phase 3**, where they become the underwater backdrop/transition for the public sections
(history/services/etc.) — matching the original brief's Phase 3 art direction ("descending deeper into a
submerged facility"). **Phase 1 is the top-down surface hero only**, plus the three R1 bug fixes. The
submerged view, fish, coffins, and scroll-dive are documented here (§11–§12) as a **Phase 3 forward
reference**, not built in Phase 1.

Three bugs found in the R1 build are fixed here regardless of the rework (§7.1 PEAK drift, §9.2 hero
copy, §13 lag investigation).

---

## 1. Context & Goals

Redwood Peak is a fictional pharmaceutical/technology company for a roleplay website. Public face:
"creators for the better good of America," B2B-only, multi-field. Underneath: a darker undercurrent
hinted at through **atmosphere and easter eggs, never stated outright**.

The landing hero is the **identity of the entire site**: a real body of water seen **from directly
above**, its surface moving, with medical detritus — pill bottles, syringes, some come open and leaking
their contents — floating on and just under the surface. Cold light, real refraction, real ripples that
answer the cursor. Everything downstream gets art-directed around this water.

**Standing design filter (applies to every embellishment, listed or not):** before adding any visual or
audio flourish, ask *"does this make the water feel more alive?"* If yes, it belongs. If it is only
independently impressive, leave it out. Cohesion around one feeling beats a pile of disconnected effects.

**Chosen mood (unchanged): "Flooded Vault."** Dim, cold, near-black water with a steel-green tint;
heavy fog into the depth; restrained caustics; ominous but legible. Retain the ability to push darker.

**Chosen composition (REVISED): "Top-down surface" (Phase 1).**
- **Hero (the whole of Phase 1):** camera looks **straight down** at the water's surface from above. The
  surface is alive — real waves, tossing and turning, not flat. Bottles/syringes are **small, spread
  evenly** across the visible water (not large and clustered at center). Some are "open," leaking
  pills/particles that drift loosely nearby. In the far distance: a sloped shoreline with a **tanker truck
  pouring something into the water** (the "poisoning the river" nod — never stated). Hero copy anchored
  left; audio toggle top-right; discrete drop-tray slot.
- **Submerged + scroll-dive → Phase 3 (deferred):** documented in §11–§12 as a forward reference; not
  built in Phase 1.

Fog represents **distance downward below the surface** (not distance into the screen). Architecturally the
Phase 1 camera is fixed top-down over the surface; the Phase 3 dive will later animate this same camera
down into the deep, so Phase 1 builds the surface world in a way that can extend downward later.

### Success criteria (Phase 1)
- The hero reads as **looking down onto living water** with things floating on it — not a side-on tank,
  not elements placed on a page.
- Real 3D: real perspective camera, real per-object depth, real glass refraction, real surface waves,
  and a **real cursor-driven surface displacement** (the cursor cuts the water and pushes it away,
  ripples radiating outward) — no faked CSS blur/gradient substitutes.
- Bottles are small, evenly spread, and **continuously drifting** (including the four PEAK bottles).
- The distant tanker is visible pouring into the water (easter egg), via the GLB swap-seam.
- Runs acceptably under a **production build** (`npm run build && npm start`), not just judged in dev.
- `npm run build` passes with zero errors. Real-browser smoke check passes.
- A changelog entry (v0.1.x) is produced in Redwood's deadpan faux-corporate voice.

---

## 2. Tech Stack & The Seam

| Concern | Tool |
|---|---|
| App shell, routing, DOM/UI | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Hero 3D scene graph | React Three Fiber |
| Renderer | Three.js |
| Timed choreography (intro rise, hover ease, camera breathing) | GSAP (ScrollTrigger added in Phase 3 for the dive) |
| Glass | `MeshPhysicalMaterial` (`transmission`) + HDRI environment map |
| Water surface (waves + cursor displacement), caustics | Custom GLSL via `ShaderMaterial` |
| Bloom / DoF / vignette / chromatic aberration | `@react-three/postprocessing` |
| Dev-only live tuning | Leva (stripped from production) |
| GLB loading (future swap-in: PEAK bottles **and the tanker**) | `@react-three/drei` `useGLTF` (via the §8 presence-probe seam) |

**The seam:** one R3F `<Canvas>` sized to the hero/scroll region renders **only the water world**. All
UI (copy, CTAs, audio toggle, tray) is plain DOM/Tailwind over the canvas. Supabase untouched in Phase 1.

**Explicitly skipped (per brief):** Theatre.js, procedural audio synthesis, site-wide volumetric fog
(fog scoped to the water world), node-based animation editors.

---

## 3. Design Tokens

Unchanged from R1. Sampled from the supplied logo; defined once in `styles/tokens.ts` + `styles/tokens.css`
and mirrored into the Tailwind theme. No one-off colors.

| Token | Value | Role |
|---|---|---|
| `--rw-black` | `#0a0a0a` | base / silhouettes |
| `--rw-charcoal` | `#141414` | raised surfaces |
| `--rw-red` | `#c1272d` | primary accent / actions |
| `--rw-red-deep` | `#7a1518` | hovers, deep-red bleed |
| `--rw-bone` | `#f5f5f4` | text on dark |

Red is always the accent; black/charcoal is always the base.

---

## 4. Brand & Scene Assets

| Asset | Path | Notes |
|---|---|---|
| Full logo badge | `public/brand/redwood-peak-logo.png` | **Provided.** Favicon + Phase 2 loading spinner. |
| Mountain/pine mark | `public/brand/redwood-peak-mark.svg` | Monochrome silhouette (background/deep logo layer). |
| HDRI environment | `public/hdri/dark-studio.hdr` (+ `-low`) | CC0; lights the glass. |
| Ambient audio clips | `public/audio/*.ogg` | **Pending** CC0 swap-ins; scheduler degrades to silent. |
| **PEAK hero bottle models** | `public/models/hero-bottle-{p,e,a,k}.glb` | **Pending**, user-modeled in Blender; procedural fallback via §8. |
| **Tanker truck model** | `public/models/tanker.glb` | **Pending**, user-modeled in Blender; procedural truck-block placeholder via §8. **Do not model/texture the truck ourselves.** |

---

## 5. File Structure (revised)

```
app/page.tsx                          → composes <Hero/> (canvas + overlay) ; the scroll region
components/hero/
  Hero.tsx                            → dynamic(ssr:false) HeroTank + HeroOverlay
  HeroTank.tsx                        → <Canvas>, env map, postprocessing, quality gating, Leva dev-guard
  WaterWorld.scene.tsx                → the surface water world (built to extend downward in Phase 3); was TankScene
  useCameraBreathing.ts               → subtle idle drift
  surface/
    WaterSurface.tsx                  → top-down water plane: real waves + cursor displacement (GLSL)
    shaders/waterSurface.glsl.ts      → wave + cursor-displacement vertex/fragment
  objects/
    Bottle.tsx / Syringe.tsx          → procedural field objects (unchanged geometry)
    OpenBottle.tsx                    → an "open" bottle + loose floating contents (pills/particles)
    HeroBottle.tsx / HeroBottles.tsx  → 4 PEAK bottles: swap-seam + tagging + AMBIENT DRIFT (bug fix) + hover
    proceduralBottleGeo.ts            → geometry builders (unchanged)
    glassMaterial.ts                  → glass factory (unchanged)
    useOptionalGLTF.ts                → presence-probe swap-seam (unchanged; reused by tanker)
    useAmbientDrift.ts                → shared gentle floating/drift applied to field AND hero bottles
  scenery/
    Tanker.tsx                        → far shoreline + tanker (GLB-or-procedural block) pouring into water
  Bubbles.tsx                         → upward bubbles
  CausticsPlane.tsx + shaders/caustics.glsl.ts
  BackgroundLogo.tsx                  → looming mark, faint beneath the surface (addressable for Phase 2)
  HeroOverlay.tsx                     → DOM: copy reveal, CTAs, audio toggle, tray slot
  CopyReveal.tsx                      → typewriter delete/retype phrase cycler (revised)
  useRevealSequence.ts / phrases.ts / quality.ts / peak.ts  (unchanged)

  # Phase 3 (deferred, NOT built in Phase 1):
  #   useScrollDive.ts                → ScrollTrigger camera dive: top-down surface → side-on deep
  #   deep/Fish.tsx, deep/Coffins.tsx → submerged-view life + bottom easter egg
lib/audio/AmbientScheduler.ts         (unchanged)
styles/tokens.{ts,css}                (unchanged)
```

---

## 6. The Water World — Surface (top-down)

### 6.1 Camera & orientation
`PerspectiveCamera` positioned **above** the water looking **straight down** (−Y) at the surface in the
hero state. Pulled **far enough back** that bottles read **small and spread**, not large and clustered.
Subtle idle breathing (incommensurate sines) layers on top. The scroll dive (§12) animates this camera
down and pitches it toward horizontal for the submerged view.

### 6.2 Glass material — **unchanged** (`glassMaterial.ts`)
`MeshPhysicalMaterial`, `transmission`, tuned via the R1 lighting pass. Shared by every object.

### 6.3 Object field near the surface
- Bottles/syringes are **small** and distributed **evenly across the visible water plane** (x/z spread),
  floating at/just under the surface — explicitly **not** bunched at center-frame.
- Most objects sit near the surface; depth (downward, −Y) increases toward the submerged view.
- **All field objects drift continuously** (gentle bob + slow rotation) via `useAmbientDrift`.

### 6.4 Depth fog — **reinterpreted as downward depth**
Fog now represents **distance below the surface**: objects/scenery deeper in the water fade into haze as
depth increases, not as distance-into-screen. In the top-down hero this reads as a soft darkening toward
"deeper" water; in the submerged view it becomes classic recede-into-the-deep fog. Tunable via Leva.

### 6.5 Light sweep — reinterpreted top-down
A single cold light sweeps **across the surface** on a 20–30s cycle (a moving glint/caustic band traveling
over the water and the floating glass), catching bottle highlights as it passes. Same real-material
principle, reoriented to travel across the surface plane rather than across a side-on tank.

### 6.6 Real waves (surface) — `WaterSurface.tsx` + `waterSurface.glsl.ts`
The surface is a subdivided plane whose vertices are displaced by a **moving wave field** (summed
gerstner/noise waves in the vertex shader) so it visibly tosses and turns. The fragment shader does the
cold-tint + fresnel + caustic glints. This replaces the R1 flat caustics-only background as the primary
surface; caustics remain as an additional cue projected through the water.

### 6.7 Cursor = real surface displacement (replaces cosmetic ripple)
The cursor maps to a **point on the water's surface** (raycast from the top-down camera onto the plane).
Moving it **pushes the water away** from that point — a displacement injected into the wave field that
**radiates outward as real ripples/waves**, and nearby floating bottles drift away from the disturbance
before settling. This is genuine vertex displacement in the surface shader, not an overlay in front of the
camera. (See §10.1.)

### 6.8 Bubbles
Sparse bubbles rise toward the surface (more visible in the submerged view). Champagne, not fish-tank.

### 6.9 Open bottles + loose contents — `OpenBottle.tsx`
A **restrained** number of bottles render "open" (cap off / uncorked), with their contents — pills, small
particles — **floating loosely nearby**. Enough to read as "things have come open in the water," never
cluttered. Counts gated by `quality.ts`.

### 6.10 Background logo layer
The looming monochrome mark sits **faintly beneath the surface**, looming below the floating objects, low
opacity. Still named/addressable so Phase 2 can drive its flicker/darkness moments (and so Phase 3 can sink
it toward the bed as the camera dives).

### 6.11 Tanker + shoreline (easter egg) — `scenery/Tanker.tsx`
In the **far distance**, a **sloped shoreline** (solid ground at an angle) with a **tanker truck** parked
on it, **pouring something into the water** — a visible nod to "poisoning the river," never stated. Built
via the §8 **GLB swap-seam**: a simple procedural **truck-shaped block** placeholder at `public/models/tanker.glb`
until the user's Blender model is dropped in. **We do not model or texture the truck ourselves.** The pour
is a thin particle/stream effect entering the water (restrained).

### 6.12 Postprocessing
Bloom + light DoF + vignette + subtle chromatic aberration, gated by `quality.ts`. DoF reads as genuine
depth blur toward the deep.

### 6.13 Labels
Real pharma names as cosmetic flavor text only (Propofol, Fentanyl, Ketamine, Atropine, Etomidate, …),
**name only**. Illegible at rest; readable on hover (§10.2).

---

## 7. PEAK Bottles — drift, tagging, fishing

### 7.1 BUG FIX — PEAK bottles must drift
In R1 the four PEAK bottles were given fixed positions + hover rotation only; they were **static, stuck
to the camera**. They must receive the **same continuous ambient drift** (`useAmbientDrift`) as every other
floating object — gentle bob, slow rotation, slight wander around their resting area. Hover-to-read (§10.2)
**layers on top of** this drift; it does not replace it. Their tagging/registry behavior is unchanged.

### 7.2 Tagging/registry — **unchanged**
The four bottles still tag their rendered Object3D (`isPeakBottle`/`peakLetter`/`drug`) and register into
the `PeakRegistry`, queryable as a set. Fixed pairings P=Propofol, E=Etomidate, A=Atropine, K=Ketamine.
The automated contract test still holds.

### 7.3 Fishing visual (drag is Phase 2) — documented here for continuity
When a PEAK bottle is dragged **up out of the water** toward the tray (Phase 2 mechanic), it should:
break the surface with a **ripple at the break point**, and trail a **dripping effect** (small falling
water drops) as it's lifted clear and moved to the tray. **Implementation belongs to Phase 2** (with the
drag/raycast). Phase 1 leaves the surface-ripple injection point (§6.7) and the tray slot ready for it.

---

## 8. GLB Swap-Seam (PEAK bottles + tanker) — `useOptionalGLTF.ts`

Unchanged mechanism, now used for **two** model types. A HEAD-probe (`useAssetPresence`) checks for the
`.glb`; if absent → procedural fallback; if present → the GLB child mounts inside Suspense + an
ErrorBoundary that falls back to procedural. Dropping a real model at the known path swaps it in with
**zero edits** elsewhere.
- PEAK bottles: `public/models/hero-bottle-{p,e,a,k}.glb` → detailed procedural bottle fallback.
- **Tanker:** `public/models/tanker.glb` → procedural truck-shaped block fallback.

---

## 9. Choreography (GSAP)

### 9.1 Intro / fill sequence — reinterpreted top-down
The water holds a beat, then objects **rise into view from the deeper water below the surface**, viewed
**from above** — staggered, varied per object (some rotate as they rise, some pause partway, a minority
rise over ~30s from far down). Reuses the existing `buildRiseSchedule` timelines; the rise axis is the
camera-down (−Y) "up toward the surface," read in the top-down framing.

### 9.2 Copy reveal — typewriter effect + **copy fix**
**Copy fix:** the second line must read **"We are The Redwood Co."** (not "The Redwood Co."), so it reads
as the company introducing itself rather than greeting an entity. Final copy:
1. `Hello,` — normal size, `--rw-bone`.
2. `We are The Redwood Co.` — large display size, `--rw-bone`.
3. `We are a ▮` — normal size; the trailing slot cycles the five red phrases.

**Animation change — typewriter, not crossfade/slide.** The phrase line is a **letter-by-letter delete**
of the current phrase (backspacing it out, like a terminal/typewriter cursor) followed by a
**letter-by-letter retype** of the next phrase, looping continuously through all five:
"A Pharmaceutical company" → "A Technological company" → "Creators for the better good of America" →
"Outdoor camping equipment sellers" → "A logistics company" → (loop). A blinking cursor caret (`▮`) sits at
the type position. Phrase data/order unchanged (`phrases.ts`); the **crossfade/slide rendering is replaced**
by the delete/retype timing model. The full reveal still plays once on load; scroll-to-top still replays
the phrase cycling only (the typewriter loop resumes), per `useRevealSequence`.

### 9.3 Camera breathing
Subtle idle drift, layered under the scroll dive.

---

## 10. Live Interaction

### 10.1 Cursor surface displacement (replaces cosmetic ripple)
Top-down: raycast the cursor onto the water plane to get a surface point; inject a displacement at that
point into the wave field so the water is **pushed away** and **ripples radiate outward**; floating bottles
within the radius drift away then settle. Real vertex displacement, not an overlay. As the camera dives to
the submerged view, this gracefully hands off to the deep view's gentler drift model.

### 10.2 Hover-to-read (raycast) — **unchanged behavior, on top of drift**
On hover, a bottle rotates toward the camera over ~0.5s with a soft overshoot until its label faces the
viewer; on leave it lazily drifts back. This now composes with the ambient drift (§7.1) rather than acting
on a static object.

---

## 11. Submerged View — **Phase 3 (deferred), forward reference**

> Not built in Phase 1. Documented so Phase 1 builds the surface world in a way that can extend downward.

Below the hero (in Phase 3), the camera reaches the **side-on submerged deep** — the original R1 aquarium
view, retained here. Requirements:
- **Genuinely deep and wide:** real z/Y depth, things receding into fog in the background and sitting in
  peripheral vision — **not** everything crammed at the front plane.
- **Fish swimming** (`Fish.tsx`) — simple procedural fish with wander/schooling drift.
- **Bottles are rare here** — most contents are up at the surface; only the occasional bottle drifts this
  deep. Counts: a small fraction of the surface density.
- **Coffins on the bottom** (`Coffins.tsx`) — a few, resting on the bed, **subtle**: visible if you look,
  never a focal point.
- The looming logo mark sits faintly on/near the bed (§6.10).

What happens **past** the submerged view (history/services/other public sections) is **undecided and not
built in this phase** — to be designed separately once the surface→submerged transition works.

---

## 12. Scroll Transition (surface → submerged) — **Phase 3 (deferred)** — `useScrollDive.ts`

> Not built in Phase 1. One continuous water world; scroll progress drives a GSAP **ScrollTrigger** timeline that:
- moves the camera **downward** from above-the-surface into the deep, and **pitches** it from looking
  straight down (−Y) toward side-on (horizontal),
- hands off the interaction model from surface-displacement (§10.1) to the gentler submerged drift,
- crossfades object density from surface-concentrated to deep-rare, revealing fish/coffins.
The transition must feel like a coherent **dive**, not a cut. Pinning/scroll length tuned during build.

---

## 13. Performance / Mobile — **diagnose before cutting**

The R1 build felt laggy. **Before assuming the architecture is too heavy, confirm whether it's a dev-mode
artifact**: React Strict Mode double-render, Leva's live panel, and unminified Three.js all inflate dev
cost. **Measure under a real production build** (`npm run build && npm start`), not `npm run dev`.

If it is still laggy under production, do an **actual profiling pass** before deleting anything:
- instance/object counts (field + open-bottle contents + fish),
- postprocessing cost (toggle passes and measure),
- shader complexity (waves + caustics + displacement),
and cut/optimize what profiling shows is expensive — **do not throw effects away blindly**.

The rework itself reduces load (smaller/fewer/even-spread bottles; deep view is sparse). `quality.ts` tiers
still cap dpr and gate counts/postprocessing/caustics on low-end; the four PEAK bottles remain present and
interactable on every tier. Leva remains dev-only and **stripped from production** (verified absent from
`.next/static/chunks`).

---

## 14. Overlay Controls (DOM) — largely unchanged

- **CTAs:** "Join Us" → `https://discord.gg/vPCWTzMXRa` (new tab); "Apply Now" → disabled "Applications
  opening soon" until `APPLY_FORM_URL` is set. Stamped-press interaction.
- **Audio:** `AmbientScheduler`, randomized interval/volume, **off by default, never autoplays**, toggle
  top-right. Clips pending.
- **Drop tray:** Phase 1 renders the discrete visual slot only; drag/solve is Phase 2 (with the §7.3 fishing
  ripple/drip).

---

## 15. Explicitly NOT in Phase 1 (Phase 2 seams only)

- PEAK drag-to-tray, the fishing ripple/drip on lift (§7.3), order validation, near-miss flicker.
- Drain sequence, fade-to-black, loading screen, route to login.
- Session-solved flag.
- **Submerged side-on view, fish, coffins, and the scroll-dive transition (§11–§12) → Phase 3.**
- Public sections past the hero (history/services/etc.) → Phase 3.

Phase 1 leaves the seams: tray slot, tagged drifting PEAK bottles, surface-ripple injection point,
addressable background logo, tanker GLB seam, and a surface world built to extend downward (Phase 3 dive).

---

## 16. Verification

- `npm run build` passes with **zero errors**; production run (`npm start`) used for the perf check.
- **PEAK tagging contract** automated test still passes (4 bottles, correct tags, queryable as a set).
- Real-browser smoke check of the corrected composition: top-down surface with small, evenly-spread,
  **drifting** bottles (PEAK bottles included — confirm they move); moving waves; cursor pushes the water
  and ripples radiate; light sweep across the surface; tanker visible in the distance pouring; copy reads
  "Hello, / We are The Redwood Co. / We are a [typewriter delete-retype cycling]"; hover-to-read works on
  top of drift; Join Us opens Discord; Apply Now disabled; audio toggle never autoplays.
  (Scroll-dive into the submerged deep is Phase 3 — not verified in Phase 1.)
- Quick low-end check: coherent simplified water world, no frame collapse.
- Leva absent from the production bundle.

---

## 17. Deliverable: Changelog

Produce a **v0.1.1 — "Surfacing"** (or similarly-themed) entry capturing the corrected composition, in
Redwood's deadpan faux-corporate voice, same structural pattern as v0.1.0. (The v0.1.0 entry stays as the
record of the first cut.)

---

## 18. Recommended Build Sequencing (for the revised plan)

1. **Bug fixes first (cheap, independent):** copy text (§9.2), PEAK ambient drift (§7.1).
2. **Perf diagnosis:** prod build + `npm start`; profile if still laggy (§13). Informs later counts.
3. **Top-down camera + spread/scale:** reorient camera, pull back, shrink + evenly spread bottles (§6.1/6.3).
4. **Real wave surface + cursor displacement** (§6.6/§10.1) — the core of the new feeling.
5. **Reinterpret fog (downward), light sweep, intro rise** for top-down (§6.4/6.5/9.1).
6. **Typewriter copy cycler** (§9.2).
7. **Open bottles + loose contents** (§6.9).
8. **Tanker + shoreline** via GLB seam + procedural block (§6.11/§8).
9. **Compose + smoke-check + changelog** — Phase 1 done.

(Phase 3, separate spec/plan later: submerged view §11, scroll dive §12, and the public sections.)
Each step ends green (`npm run build`); a changelog entry when the rework lands.

---

## 19. Open Items / Dependencies

- **Tanker `.glb`** (user, Blender) — procedural truck-block placeholder until dropped in.
- **PEAK `.glb` models** (user, Blender) — procedural fallback (existing seam).
- **Google Form URL** pending (`APPLY_FORM_URL`).
- **CC0 audio clips** pending.
- **Scroll length / pin behavior** for the dive — tuned during build.
- Public sections past the submerged view — **deferred**, designed separately later.
```

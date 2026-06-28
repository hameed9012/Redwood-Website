# Redwood Peak — Phase 1: Landing Page Hero — Design Spec

**Date:** 2026-06-28
**Status:** Approved for planning
**Scope:** Phase 1 of 7 only. This is one sub-project of the larger Redwood Peak build; each
phase gets its own spec → plan → implementation cycle. Phases 2–7 are out of scope here except
where Phase 1 must leave seams for them.

---

## 1. Context & Goals

Redwood Peak is a fictional pharmaceutical/technology company for a roleplay website. Public face:
"creators for the better good of America," B2B-only, multi-field. Underneath: a darker undercurrent
hinted at through **atmosphere and easter eggs, never stated outright**.

The landing hero is the **identity of the entire site**: a large medical tank, viewed through cold
water, in which pill bottles and syringes are suspended — rising from darkness, drifting, refracting
a slow-moving light. Everything downstream gets art-directed around this scene.

**Standing design filter (applies to every embellishment, listed or not):** before adding any visual
or audio flourish, ask *"does this make the tank feel more alive?"* If yes, it belongs. If it is only
independently impressive, leave it out. Cohesion around one feeling beats a pile of disconnected effects.

**Chosen mood (decided in brainstorming): "Flooded Vault."** Dim near-black water with a cold
steel-green tint, heavy depth fog, one slow cold light sweep, caustics dialed back to a suggestion,
a faint deep-red bleed from the logo behind the water. Ominous but still legible — it hints at the
undercurrent *and* still shows off the real glass + caustics the 3D stack exists to render. Retain the
ability to push a notch darker after first render.

**Chosen composition (decided in brainstorming): "Left-anchored."** Hero copy and CTAs anchored
left; the right two-thirds of the tank stays open water so the rise-from-darkness reads clearly. A
discrete bottom-center drop tray (visual slot only in Phase 1). Audio toggle top-right.

### Success criteria
- The hero reads as objects floating up inside a filling medical tank, **not** as elements placed on a page.
- Real 3D: real perspective camera, real per-object depth, real glass refraction, real depth-of-field —
  no faked CSS blur/rotation/gradient substitutes.
- Never feels like a fixed, repeating loop (staggering across both time and depth).
- `npm run build` passes with zero errors. Manual browser smoke check passes.
- A `v0.1.0` changelog entry is produced in Redwood's deadpan faux-corporate voice.

---

## 2. Tech Stack & The Seam

| Concern | Tool |
|---|---|
| App shell, routing, DOM/UI | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Hero 3D scene graph | React Three Fiber |
| Renderer | Three.js |
| Timed choreography (intro rise, hover ease, camera breathing, replay) | GSAP |
| Glass | `MeshPhysicalMaterial` (`transmission` on) + HDRI environment map |
| Water ripple + caustics | Custom GLSL via `ShaderMaterial` |
| Bloom / DoF / vignette / chromatic aberration | `@react-three/postprocessing` |
| Dev-only live tuning | Leva (stripped from production build) |
| GLB loading (future swap-in) | `@react-three/drei` `useGLTF` |

**The seam:** the hero is a single client component owning **one** R3F `<Canvas>` sized to the viewport.
The canvas renders **only the tank**. All UI — hero copy, CTAs, speaker toggle, and (Phase 2) the puzzle
tray — is plain DOM/Tailwind absolutely positioned **over** the canvas. No login form, dossier composer,
or any other UI ever renders through WebGL. **Supabase is not touched in Phase 1** (it first appears in
Phase 3's contact form).

**Explicitly skipped (per brief):** Theatre.js, procedural audio synthesis, site-wide volumetric fog
(fog is scoped to the tank scene only), and any node-based animation editor.

---

## 3. Design Tokens

Provisional values sampled from the supplied logo PNG; exact hex re-sampled from the committed file at
implementation. Defined once in `styles/tokens.css` as CSS variables and mirrored into the Tailwind theme.
**No one-off colors anywhere** — same discipline as the reference Lore token system.

| Token | Value (provisional) | Role |
|---|---|---|
| `--rw-black` | `#0a0a0a` | base / badge field / silhouettes |
| `--rw-charcoal` | `#141414` | raised surfaces, cards (later phases) |
| `--rw-red` | `#c1272d` | primary accent / actions |
| `--rw-red-deep` | `#7a1518` | outline ring, hovers, underwater logo bleed |
| `--rw-bone` | `#f5f5f4` | text on dark |

**Red/black discipline (pulled forward from Phase 7):** red is always the accent/action color; black/
charcoal is always the base. No screen has large fields of both competing for dominance.

---

## 4. Brand Assets

| Asset | Path | Notes |
|---|---|---|
| Full logo badge | `public/brand/redwood-peak-logo.png` | **Provided by user.** Used for loading spinner (Phase 2) and favicon. |
| Mountain/pine mark | `public/brand/redwood-peak-mark.svg` | Monochrome silhouette derived from the badge; used for the looming underwater background-logo layer. |
| HDRI environment | `public/hdri/dark-studio.hdr` | Bundled CC0 dark-studio HDRI. The glass needs something to reflect. Low-res variant for mobile. |
| Ambient audio clips | `public/audio/*.{ogg,mp3}` | Small pool of CC0/royalty-free clips (drip, metal creak, bubble surfacing, distant water), sourced and trimmed during implementation. Swappable. |

---

## 5. File Structure

```
app/
  page.tsx                          → composes <HeroTank/> + <HeroOverlay/>
  layout.tsx                        → fonts, tokens, metadata
components/hero/
  HeroTank.tsx                      → the <Canvas>, camera, env map, scene fog, postprocessing stack
  Tank.scene.tsx                    → scene graph: object field, bubbles, caustics plane, light sweep, bg logo
  objects/
    Bottle.tsx                      → procedural lathe bottle + glass material + label (background field, instanced)
    Syringe.tsx                     → procedural syringe primitive + glass material
    HeroBottle.tsx                  → the 4 PEAK bottles: GLB-or-procedural swap seam (see §8)
    proceduralBottleGeo.ts          → shared lathe/primitive geometry builders (cheap field + detailed hero variants)
  Bubbles.tsx                       → sparse upward particle stream
  shaders/
    caustics.glsl.ts                → voronoi/noise caustics (vertex + fragment strings)
    waterRipple.glsl.ts             → cursor-reactive ripple/refraction distortion
  HeroOverlay.tsx                   → DOM layer: copy reveal, CTAs, speaker toggle, tray slot
  useRevealSequence.ts              → GSAP timeline: intro reveal + scroll-to-top replay
  useCameraBreathing.ts             → incommensurate-sine camera drift
  quality.ts                        → device tier detection + count/quality constants (shared by later phases)
lib/audio/
  AmbientScheduler.ts               → randomized clip-pool player (off by default)
styles/
  tokens.css                        → palette CSS vars + Tailwind theme bridge
```

---

## 6. The Scene Graph (`Tank.scene.tsx`)

### 6.1 Camera & breathing
`PerspectiveCamera`. Continuous drift on position + rotation driven by **layered sine waves at
incommensurate frequencies** (never a clean repeating loop), magnitude small enough to be felt, not
consciously noticed. Implemented in `useCameraBreathing.ts`, advanced per-frame.

### 6.2 Glass material
`MeshPhysicalMaterial` with `transmission: 1`, tuned `roughness`, `thickness`, `ior`, `attenuation*`,
lit by the HDRI environment map. Real refraction/reflection/highlights — no baked or faked reflections.
Shared material factory so every object (field + hero) uses identical glass; only geometry differs.

### 6.3 Object field & depth
- Bottles and syringes distributed across **real z-depth**. Most live far back, mostly obscured by fog.
- Background field uses **instanced** procedural geometry for cheapness; counts come from `quality.ts`.
- Each object drifts slowly with gentle rotation, looping vertically.
- Occasionally a far-back bottle rises over a **long (~30s)** duration while nearer ones cycle faster —
  so by the time it reaches a noticeable depth, another far-back rise has already begun. This staggering
  **across both time and depth** is the primary defense against the scene reading as a fixed loop.

### 6.4 Depth fog
Scene fog, cold steel-green (Flooded-Vault mood), scoped to the tank only. Far objects dissolve into haze
rather than staying crisp. This is what makes "rising from far away" read as genuine distance instead of
objects popping in. Tunable via Leva (`fogDensity`).

### 6.5 Light sweep
A single light source sweeps across the tank on a **20–30s cycle**. As it passes an object the real glass
catches it — highlight, brief refraction flare, a moment where the label is faintly illuminated — then it
moves on. This is the real material reacting to a moving light, **not** a separate effect.

### 6.6 Caustics
`caustics.glsl.ts` — looping-but-not-obviously voronoi/noise caustics projected onto the background plane
and **faintly** onto nearby bottle surfaces. The single highest-leverage "underwater" cue. Dialed back per
the Flooded-Vault mood. Tunable via Leva (`causticIntensity`).

### 6.7 Bubbles (`Bubbles.tsx`)
Sparse upward particle stream — champagne, not fish-tank. Most barely visible; occasionally one catches
the light sweep and glints before continuing past. Count from `quality.ts`.

### 6.8 Background logo layer
The monochrome mountain/pine **mark** (`redwood-peak-mark.svg`) rendered large and low-opacity **behind**
the water, looming/overshadowing. An almost-imperceptible **breathing scale pulse** (multi-second cycle)
plus a faint `--rw-red-deep` bleed. Mostly static — alive, not distracting. (Phase 2 will drive a near-miss
flicker and a swallowed-by-darkness moment through this same layer; build it addressable for that.)

### 6.9 Postprocessing
`@react-three/postprocessing`: bloom + light depth-of-field + vignette + very subtle chromatic aberration.
DoF is **real** — distance blur comes from actual scene depth, not a hardcoded CSS value. All four are a
small addition on top of the real glass + lighting, not separate undertakings. The whole stack is gated by
`quality.ts` (simplified/dropped on low-end — see §10).

### 6.10 Labels
Real pharmaceutical names with known dual-use reputations as **cosmetic flavor text only** (e.g. Propofol,
Fentanyl, Ketamine, Atropine, Etomidate, and similar). **Name only** — no dosage, synthesis, or usage text
on any label, ever. Labels are illegible at rest (turned away / angled, not merely blurred).

---

## 7. Choreography (GSAP) — `useRevealSequence.ts`

### 7.1 Intro / fill sequence
1. Tank starts **empty**; water holds empty for a beat.
2. Objects rise from darkness below the frame, **staggered** (one rises, pauses or continues, then another
   follows a moment later) — never simultaneous.
3. **Varied per object:** some rotate slowly while rising; some stop partway up and hang before continuing;
   some drift **behind** the background logo layer rather than in front.
4. Combined with the long far-back rises (§6.3), the tank reads as gradually filling, never as elements
   appearing on a page.
Each object's rise is keyed as its own GSAP timeline so behavior can be authored per-object.

### 7.2 Copy reveal (DOM, in `HeroOverlay.tsx`)
Exact structure and order:
1. `Hello,` — normal size, `--rw-bone`.
2. `The Redwood Co.` — large display size, `--rw-bone`, directly below.
3. `We are a.` — normal size, `--rw-bone`. The instant it renders, the period is replaced by a cycling
   sequence of **red** (`--rw-red`) phrases that recede/exit and are replaced by the next, looping
   continuously through, with a few-second hold each:
   - "A Pharmaceutical company"
   - "A Technological company"
   - "Creators for the better good of America"
   - "Outdoor camping equipment sellers"
   - "A logistics company"
   Transition is a smooth **crossfade-and-slide**.
4. The full reveal plays **once** on page load. If the visitor later **scrolls back to the very top**, play
   a **shorter replay of just the cycling phrases** (skip the "Hello / The Redwood Co." part) so returning
   to the top still feels alive.

---

## 8. Hero Bottles & The GLB Swap Seam — `HeroBottle.tsx`

The four PEAK bottles (Phase 2 will make them draggable; Phase 1 only renders + tags them) are **procedural
for now**, with a **richer silhouette** than the cheap background field since they are hovered and read
closely. Geometry comes from the detailed variant in `proceduralBottleGeo.ts`.

**Swap seam (required structure, so future Blender work is drop-in):**
- `HeroBottle.tsx` attempts to load a `.glb` from a known per-bottle path (e.g.
  `public/models/hero-bottle-{p,e,a,k}.glb`) via `useGLTF`.
- If the file is **present**, it renders the loaded mesh and applies the shared glass material factory.
- If the file is **absent**, it falls back to the detailed procedural geometry.
- The decision is isolated inside `HeroBottle.tsx` (e.g. a small `useOptionalGLTF(path)` helper that catches
  the missing-asset case). The scene graph, the glass material, the hover/label logic, and the Phase 2 drag
  hookup all sit **outside** this decision and do not change when a GLB is dropped in.

**Acceptance for the seam:** dropping a valid `.glb` at the known path and reloading swaps the geometry with
**zero** edits to `Bottle.tsx`, `Tank.scene.tsx`, or the hover/label/drag code.

Each hero bottle is tagged (`isPeakBottle`, its letter P/E/A/K, its drug name) so Phase 2 can find them
without re-identifying. The four pairings are fixed: P=Propofol, E=Etomidate, A=Atropine, K=Ketamine.

---

## 9. Live Interaction

### 9.1 Cursor ripple — `waterRipple.glsl.ts`
A ripple/refraction distortion shader across the water layer reacts to mouse movement: moving the mouse
pushes a soft ripple through nearby water, and bottles **within the ripple radius drift slightly away from
the cursor before settling back**. The distortion genuinely warps what's behind it (real fragment shader),
not an overlaid gradient.

### 9.2 Hover-to-read (raycast)
On raycast hover, a bottle **slowly rotates toward the camera over ~0.5s** with a lightly-applied,
slightly-overshooting `back`/`elastic` GSAP ease — like turning in the current — until its label faces the
viewer and becomes readable. On pointer-leave it does **not** snap back; it **lazily drifts back** toward its
previous resting orientation over a similarly unhurried duration with the same soft ease. Reads as something
turning in liquid, not a UI hover state.

---

## 10. Performance / Mobile (hooks built now, full pass in Phase 7)

`quality.ts` detects a device tier (hardware concurrency, device memory, a cheap GPU/WebGL capability probe,
coarse-pointer/viewport heuristics) and exposes constants consumed across the scene:
- Cap `dpr` (pixel ratio).
- Low-end tier: fewer bottles, fewer bubbles, lower-res HDRI, and **simplified or dropped postprocessing +
  caustics**.
- A **coherent simplified tank**, never a frame-rate collapse — still atmospheric on a budget phone.

The four PEAK bottles remain present and interactable on every tier (Phase 2 needs them draggable on touch).
Leva is dev-only and **stripped from the production build** via an env/`NODE_ENV` guard.

---

## 11. Overlay Controls — `HeroOverlay.tsx`

- **CTAs** (below hero copy, left-anchored):
  - **"Join Us"** → opens `https://discord.gg/vPCWTzMXRa` in a new tab.
  - **"Apply Now"** → Google Form not ready yet; rendered as a visibly **disabled** button labeled
    "Applications opening soon" (no dead link, doesn't read as broken). A `APPLY_FORM_URL` constant is the
    single place to flip it live later.
  - Both use the **stamped press** interaction: a slight compress + ink-ripple on click (consistent with the
    industrial/medical identity), **not** a generic hover-lift.
- **Audio** — `AmbientScheduler` plays one clip from the CC0 pool at a **randomized interval and randomized
  volume**, never the same sequence or spacing twice. **OFF by default. Never autoplays.** Small unobtrusive
  speaker toggle, top-right.
- **Drop tray** — Phase 1 renders only the discrete bottom-center **visual slot**. No drag/drop/solve logic
  (that is Phase 2).

---

## 12. Explicitly NOT in Phase 1 (Phase 2 seams only)

- Draggable behavior on the PEAK bottles, raycast drag-to-tray, order validation, near-miss flicker.
- Drain sequence, freeze, fade-to-black, loading screen, route to login.
- Session-solved flag.

Phase 1 leaves the seams: the tray's visual slot exists, the four hero bottles are tagged, and the background
logo layer is addressable for the Phase 2 flicker/darkness moments.

---

## 13. Verification

- `npm run build` passes with **zero errors** before Phase 1 is called done.
- Manual browser smoke check: empty-tank beat → staggered rise → copy reveal + phrase cycling →
  scroll-to-top replay (phrases only) → hover-to-read rotation + lazy return → cursor ripple → Join Us opens
  Discord → Apply Now disabled state → audio toggle works and never autoplays.
- Quick low-end check: throttled/mobile profile still renders a coherent simplified tank, no frame collapse.

---

## 14. Deliverable: Changelog Entry

Produce `v0.1.0 — Welcome to Redwood Peak` as part of Phase 1 output, in Redwood's deadpan
faux-corporate/sinister voice, following the reference structure: version header + punchy subtitle, informal
first-person intro, bolded section headers per feature group, bulleted feature call-outs (bold name, then a
conversational description), and a closing note inviting feedback. Ready to post as-is.

---

## 15. Open Items / Dependencies

- **Logo file** to be committed at `public/brand/redwood-peak-logo.png`; exact palette hex re-sampled then.
- **Google Form URL** pending — `APPLY_FORM_URL` placeholder until provided.
- **Blender `.glb` hero bottles** are a future drop-in via the §8 seam; not required for Phase 1 completion.
- **CC0 HDRI + audio clips** sourced during implementation.
- Repo/Supabase/icon-language foundations are a thin shared layer established at the start of implementation;
  the icon language (Phase 7) informs later phases but is not exercised by the Phase 1 hero.
```

# Perf diagnosis — 2026-06-29 (R2-3)

## Method
Measured a **production build** (`npm run build && npm start`), not dev mode, in a real browser via
rAF frame counting over 4s after a 2.5s warm-up. Confirmed the WebGL backend and the device tier.

## Results
- **Renderer:** `ANGLE (Intel, Intel(R) Graphics, Direct3D11)` — **real hardware (integrated GPU), not
  SwiftShader software rendering.** So the numbers reflect a genuine GPU, just an integrated one.
- **Device tier detected:** cores 12, deviceMemory 16, fine pointer → `detectTier` = **high**
  (38 bottles, 90 bubbles, postprocessing ON, caustics ON).
- **Avg FPS (prod, high tier, 1920×1009, dpr 1):** **~14.7 FPS**, worst frame ~100 ms.

## Conclusion — the lag is REAL, not a dev-mode artifact
Production (minified, no Strict-Mode double render, no Leva) still runs ~15 FPS on this machine's Intel
integrated GPU. Dev-mode inflation was **not** the cause. The cost is architectural.

## Likely cost attribution (by reasoning + scene composition)
Could not toggle live (`canvas.__r3f` isn't exposed on the prod build), so attribution is by analysis:
1. **Transmission glass is the dominant suspect.** `MeshPhysicalMaterial` with `transmission > 0` forces
   the renderer to render the scene into a transmission render target so each transmissive object can
   sample what's behind it. With **~38 field bottles + 4 PEAK + open bottles all transmissive**, this is
   the classic R3F glass-scene bottleneck — it does not scale to dozens of objects on an iGPU.
2. **Postprocessing (4 passes):** Bloom + **DepthOfField** (expensive) + Vignette + ChromaticAberration,
   full-res. DoF in particular is costly.
3. Caustics + (incoming) wave-surface shaders add fragment cost on top.

## Recommendation (NOT applied blindly — see decision below)
The single highest-leverage fix is to **stop using full transmission on every bottle**:
- Keep **real transmission only on the foreground hero/PEAK bottles** (the ones read up close), and give
  the **background field a cheaper material** (a `MeshPhysicalMaterial` without transmission, or low
  `transmission` + `opacity`, still reflective via the envMap). Distant field bottles are fogged anyway,
  so the fidelity loss is minimal where it can't be seen.
- Trim postprocessing per tier (e.g. drop **DoF** on mid; keep bloom/vignette).
- Lower the high-tier `bottleCount` (38 → ~18–24) — the R2 rework also shrinks/spreads them.

These touch the spec's "real glass (shared material) on everything" intent, so the *degree* is a product
decision (fidelity vs. framerate) — raised with the user rather than changed silently.

## Action taken / deferred
- This task: **diagnosis only** + this note. No blind effect removal.
- The concrete material-split + count/postprocessing tuning is applied during the rework / **R2-11**, once
  the final top-down scene exists, and gated by the user's fidelity-vs-perf decision.
- **Re-measure at R2-11** on the final scene (target: ≥40 FPS at mid tier on this iGPU).

## R2-11 follow-up (final scene)
- Cheap field glass alone barely moved FPS (~15→17) → field transmission was **not** the main cost.
- **Isolation test:** shrinking the viewport to ~1/5 the pixels took FPS **~16 → 50** → the scene is
  **fill-rate / fragment bound**, not geometry/draw-call bound. The full-screen postprocessing passes over
  a ~1920px canvas dominate.
- **Applied (profiling-driven, not blind):** dropped **DepthOfField + ChromaticAberration** (the two most
  expensive full-screen passes; kept bloom+vignette); **capped dpr** (high 2→1.25, mid 1.5→1); trimmed
  per-tier counts; field uses cheap glass; PEAK keeps real transmission.
- **Caveat:** headless Chromium FPS here is noisy (the window/dpr varied between runs: 1920@dpr1 vs
  2560@dpr0.75), so absolute numbers aren't authoritative. The decisive check is on the user's real
  desktop Chrome at their native resolution/dpr — the fixes (esp. the dpr cap) bite hardest there.
- **If still heavy on the real machine, next levers (in order):** reduce the water plane's screen coverage
  / subdivision, lower the caustics plane resolution, drop bloom, or force the `low` tier on integrated GPUs.

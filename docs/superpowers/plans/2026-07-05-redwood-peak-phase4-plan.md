# Redwood Peak — Phase 4 Implementation Plan

**Spec:** [2026-07-05-redwood-peak-phase4-auth-design.md](../specs/2026-07-05-redwood-peak-phase4-auth-design.md) (Approved)
**Branch:** `staging` (never push). Build one at a time, `timeout`, exclusive `.next` (no dev server).
**Method:** TDD for the pure/auth logic; browser smoke for the flow. All tasks committed on `staging`.

Status: **all complete** (built + verified in-browser at 60fps; full suite + build green).

### Foundations (pure, tested)
- **P4-1 — `lib/auth/tiers.ts`** ✅ Tier union, TIER_RANK/LABEL, `hasAtLeast` (6 tests).
- **P4-2 — `lib/auth/secretNames.ts`** ✅ Web Crypto SHA-256 `hashSecretName`, `SECRET_HASHES`
  (hashed placeholders), `resolveTier` (4 tests; case/space-insensitive, unknown → null).
- **P4-3 — `lib/auth/session.ts`** ✅ localStorage read/write/clear, SSR-safe, corrupt-tolerant (5 tests).

### Context + guard
- **P4-4 — `AuthProvider`** ✅ app-wide context; hydrates from storage (session `undefined`→null/value);
  `signIn`/`signOut`. Wired into `app/layout.tsx`.
- **P4-5 — `RequireTier`** ✅ client guard; holding state while hydrating, redirect to `/login` when
  under-tier (3 tests). `TierBadge` chip.

### Pages
- **P4-6 — `/login`** ✅ `LoginForm` (client) → `resolveTier` → `signIn` → `/portal`; refusal on
  unknown; shortcut when already in. `page.tsx` keeps metadata + logo (2 tests; old stub test updated).
- **P4-7 — `/portal`** ✅ `RequireTier` shell; greeting by tier, `TierBadge`, tier-gated nav (locked
  rows for higher tiers), sign-out. `layout.tsx` metadata (noindex).

### Gate
- **P4-8 — verification** ✅ full suite 125 passed / 4 skipped; `npm run build` zero errors
  (`/login` 98.3kB, `/portal` 89.7kB); PEAK contract green; browser smoke of all five flows
  (sign-in, tier-gating, sign-out, guard redirect, refusal).
- **P4-9 — changelog v0.4.0** ✅ "The Door Opens" + README secret-name setup + no-push handoff.

**Seams for later:** portal destinations (Phase 5 employee content, Phase 6 High Command tools);
optional cookie+middleware hardening if server-side gating is ever wanted.

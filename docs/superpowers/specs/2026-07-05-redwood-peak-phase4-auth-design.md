# Redwood Peak — Phase 4: Secret-Name Auth + Tiers — Design Spec

**Date:** 2026-07-05
**Status:** Approved (autonomous build — decisions locked below; flag any for review).
**Scope:** Phase 4 of 7. Turns the `/login` "Employee Access" stub into a working secret-name gate
with three tiers, and adds the guarded `/portal` shell. Phases 5 (employee portal content) and 6
(High Command tools) fill the portal; Phase 4 builds only the auth system + shell + routing.

---

## 1. Context & Goals

The PEAK puzzle (Phase 2) ends at `/login` — "Employee Access. Credentials are issued out-of-band."
Phase 4 makes that real: type your **secret name** and, if it's recognized, you're let in at a
**tier**. This is fictional roleplay access control, not production security — but it should *feel*
like a real gate and behave sensibly.

### Success criteria
- `/login` secret-name field is live: a recognized name signs you in and routes to `/portal`; an
  unrecognized one is refused, in the deadpan voice, without saying why.
- Three tiers, strictly ranked: **Recruit < Employee < High Command**. The signed-in tier is
  remembered across reloads until you sign out.
- `/portal` is guarded — unauthenticated visitors are bounced to `/login`. It greets you by tier,
  shows a tier badge, and presents a tier-gated nav (Phase 5/6 destinations are placeholders now).
- Secret names are **never stored in plaintext** in the bundle — only SHA-256 hashes. Adding or
  changing a name means adding a hash (documented), mirroring the Supabase shim-first approach.
- `npm run build` zero errors; full suite + PEAK contract green; v0.4.0 changelog in the voice.

### Non-goals (later phases)
- Real portal content (org chart, logs, tasks, dossiers) → Phase 5. High Command tools → Phase 6.
- Real/secure authentication, password reset, multi-user accounts, server sessions. This is a shared
  codename gate for a roleplay; no real secrets are protected.

---

## 2. Auth model — shared codenames, hashed

- A **secret name** is a shared codename issued out-of-band. Each recognized name maps to one tier.
- Names are stored as **SHA-256 hex hashes** (`lib/auth/secretNames.ts`). On submit we hash the
  input (trimmed + lowercased) and look it up. Thematically: *we don't keep your name, only proof it
  was real.* Practically: the plaintext names aren't grep-able in the shipped JS.
- **Placeholder codenames** ship so the flow is testable (swap for the real ones by replacing hashes):
  - Recruit → `minnow`
  - Employee → `tidewater`
  - High Command → `leviathan`
- **Tiers** rank `recruit(1) < employee(2) < high-command(3)`. Higher tiers see everything lower
  tiers see. `hasAtLeast(current, required)` is the gate primitive (pure, tested).
- **Session**: the signed-in `{ tier, name, at }` is persisted to `localStorage` (`rw.session`) and
  surfaced through a client `AuthProvider` context. SSR-safe (no window access during render).
  Sign-out clears it. (A cookie + middleware guard is deliberately deferred — overkill for a roleplay
  gate; the client `RequireTier` guard is sufficient and Phase 5/6 can harden later if wanted.)

## 3. Files

```
lib/auth/
  tiers.ts          → Tier union, TIER_RANK, TIER_LABEL, hasAtLeast() (pure, tested)
  secretNames.ts    → hashSecretName() [Web Crypto SHA-256 hex], SECRET_HASHES map, resolveTier() (tested)
  session.ts        → readSession/writeSession/clearSession on localStorage; SSR-safe (tested)
components/auth/
  AuthProvider.tsx  → context { session, signIn, signOut }; hydrates from localStorage on mount
  RequireTier.tsx   → client guard; redirects to /login (themed "access denied" flash) if under-tier
  TierBadge.tsx     → small tier chip
app/
  layout.tsx        → wrap children in <AuthProvider>
  login/page.tsx    → live secret-name form → resolveTier → signIn → /portal (or refusal)
  portal/page.tsx   → guarded shell: greeting by tier, badge, tier-gated nav, sign-out
  portal/layout.tsx → (optional) portal chrome
```

## 4. Login behaviour (`/login`)
- Enabled secret-name input + submit. On submit: `resolveTier(input)`.
  - **Recognized** → `signIn(tier, input)` → `router.push('/portal')`.
  - **Unrecognized** → stay; show a calm refusal: *"That name is not on any list we keep."* No hint
    which part was wrong, no lockout counter theatre. Keep "Credentials are issued out-of-band" and
    "If you don't know yours, you were not meant to."
- Already signed in → a subtle "Enter the portal →" shortcut appears.

## 5. Portal shell (`/portal`)
- Wrapped in `RequireTier required="recruit"` — no session → redirect to `/login`.
- Greets by tier ("Welcome, Recruit." / "…Employee." / "High Command."), shows `TierBadge`.
- Tier-gated nav list (placeholders; real destinations later):
  - Recruit+: **Orientation**, **Notices**
  - Employee+: **Personnel**, **Operations Log**, **Assignments**
  - High Command: **Witness Dossiers**, **Command**
  Locked rows for higher tiers render disabled with a small lock, so lower tiers can see there's more.
- **Sign out** clears the session → back to `/login`.

## 6. Verification
- `tiers` (ranking + hasAtLeast), `secretNames` (known-hash resolution, unknown → null, case/space
  insensitivity), `session` (round-trip + SSR/no-window guard) unit-tested.
- `/login` form: recognized name signs in + routes; unrecognized shows refusal (tested with mocked
  router + resolveTier).
- `RequireTier`: renders children when authorized; redirects when not (mocked router).
- `npm run build` zero errors; full suite + PEAK contract green; `/portal` + `/login` served.
- Browser smoke (preview): puzzle→drain→/login still works; sign in with `tidewater` → `/portal`
  greets Employee; sign out → `/login`; wrong name refused.

## 7. Decisions (locked; flag for review)
1. **Hashed shared codenames, not per-user accounts.** Correct for a roleplay gate; no real secrets.
2. **localStorage session + client guard**, not cookies/middleware. Simpler; harden later if desired.
3. **Placeholder codenames `minnow`/`tidewater`/`leviathan`** ship so the flow is testable; replace
   the three hashes in `secretNames.ts` with the real names' hashes when ready (README documents how).

# Redwood Peak — Phases 5–7: The Portal, High Command & Polish — Design Spec

**Date:** 2026-07-05
**Status:** Approved (autonomous build — decisions locked; flag any for review).
**Scope:** The final three phases. Phase 5 fills the employee portal (the cards Phase 4 stubbed).
Phase 6 adds the High Command tools. Phase 7 is the global polish pass (shared document component,
icon language, perf). Built on the Phase 4 auth (tiers + RequireTier + AuthProvider).

---

## 0. Shared decisions (all three phases)
- **Content, not a backend.** The portal sections are richly-themed *lore* — static, atmospheric,
  in the site's deadpan-sinister-corporate fiction voice (the History/redaction voice). No database,
  no user data, no persistence. This keeps the whole app static/deployable and fits a roleplay
  intranet (atmosphere over CRUD). Light client interactivity only (tabs, filters, expand rows,
  client-only "acknowledge"/"mark read" toggles that don't persist).
- **Voice split:** in-fiction site/portal copy stays deadpan-sinister-corporate. The dev CHANGELOG
  stays the casual first-person voice.
- **Shared chrome:** one `PortalShell` (header: logo, "Redwood Peak · Internal", tier badge, sign
  out, back-to-portal) wraps every portal route, each guarded by `RequireTier` at its tier.
- **Routing:** each card becomes `/portal/<slug>`; unlocked cards link, locked stay dimmed/🔒.

```
components/portal/
  PortalShell.tsx      → guarded chrome wrapper (RequireTier + header + back link)
  Document.tsx         → shared "internal document" frame (Phase 7): header bar, ref no.,
                         classification stripe, redaction helper — reused across sections
lib/portal/            → pure lore data modules (typed; light tests for shape/helpers)
app/portal/<slug>/page.tsx  → one per section
```

---

## Phase 5 — the employee portal (Recruit + Employee tiers)

Fills five cards. Each is a `/portal/<slug>` route in `PortalShell`.

- **Orientation** (`recruit`) — new-hire handbook: a first-day checklist, the "core values", and a
  code of conduct whose clauses get quietly unsettling toward the bottom. Onboarding, if onboarding
  were written by people who bury things.
- **Notices** (`recruit`) — a bulletin board: dated company memos, most mundane (parking, the coffee
  machine), a few not (a reminder about "the north gate", a note that the river survey is postponed
  *again*). Client-only "mark read".
- **Personnel** (`employee`) — the org chart: departments and reporting lines rendered as a tree —
  Logistics, Pharmaceutical Supply, "Community Relations", Site Maintenance, and one department with
  no name, just a box. Hover a person for their (redacted) blurb.
- **Operations Log** (`employee`) — nightly runs + shipment manifests as a filterable table: date,
  route, tanker, cargo ("industrial solvent"), tonnage, status. A few rows flagged/redacted. Filter
  by status; sort by date (the sort/filter is the pure, tested bit).
- **Assignments** (`employee`) — your task list with statuses (open / in progress / done). Client-only
  toggle to advance a task's status (doesn't persist — it's theatre). A couple of tasks are… chores
  you'd rather not have.

**Verify:** build zero errors; suite + PEAK contract green; browser smoke — sign in as Employee,
reach each section, confirm the org chart/log/tasks render and the log filter works; Recruit sees only
Orientation+Notices unlocked. Changelog line (casual voice).

---

## Phase 6 — High Command tools (High-Command tier)

The two top-clearance cards. `RequireTier required="high-command"`.

- **Witness Dossiers** (`high-command`) — persons of ongoing interest: a roster of dossier cards
  (codename, status: *watched / relocated / resolved*, last-seen, a redacted summary). Selecting one
  opens the full dossier in the shared `Document` frame. Deadpan, ominous, never explicit.
- **Command** (`high-command`) — directives + "the deep ledger": standing directives (numbered, cold),
  and a ledger table that reads like the Operations Log's darker twin — inflows/outflows with
  counterparties redacted, totals that don't quite add up. A single control that does nothing but
  says "Purge" and asks you to reconsider.

**Verify:** an Employee session is bounced from both routes (guard); a High Command session reaches
them; build + suite green. Changelog line.

---

## Phase 7 — polish (global)

- **Shared `Document` component** — the "internal document" frame (classification stripe, ref number,
  redaction helper, monospace metadata) factored out and used by Dossiers, Command, and retro-fitted
  where it improves consistency. The redaction helper generalizes the Media redaction (solid bar +
  faint legible text, inline-flowing).
- **Icon language** — replace the placeholder glyphs (Services tiles, portal cards, lock) with one
  small consistent inline-SVG set (stroke, currentColor) so the UI reads as one system. No icon lib.
- **Perf + a11y sweep** — memo/asset check on the portal routes; ensure the 3D hero stays lazy and
  off the portal routes; focus states, aria on interactive bits, prefers-reduced-motion honored by
  the dive + typewriters; final Lighthouse-ish pass by eye.
- **Full verification gate** + a consolidated changelog line, still casual voice.

**Verify:** build zero errors; full suite + PEAK contract green; Leva stripped; the portal routes
don't pull the R3F/three bundle; browser smoke of the whole flow end-to-end.

---

## Locked decisions (flag for review)
1. **Static lore, no backend** for all portal content (Supabase stays contact-only).
2. **Client-only interactivity** (mark-read, task status, filters) — nothing persists; it's in-fiction
   theatre, resets on reload.
3. **Phase 6 grouping:** Witness Dossiers + Command are High Command (matches the Phase 4 nav gating),
   even though an earlier note filed Dossiers under Phase 5.

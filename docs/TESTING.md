# Redwood Peak — testing guide

A quick manual run-through of the whole thing. Do it in order — it roughly follows a real visitor's path.

## 0. Setup
- Run it: `npm run dev` → open `http://localhost:3000`.
- Best in a **desktop browser** first (the hero is built for it). Chrome/Edge/Firefox.
- To reset everything between runs: use a **fresh incognito/private window** (or clear the site's storage in DevTools → Application → Clear site data). This resets the "puzzle solved" flag and any login.

## Test credentials (keep these secret from real users)
- **Puzzle answer (P-E-A-K):** drag the bottles into the tray in this order, left→right: **Propofol → Etomidate → Atropine → Ketamine**. (Hover a bottle to see its name.)
- **Secret names** for `/login` (placeholders — swap before launch):
  - `minnow` → **Recruit**
  - `tidewater` → **Employee**
  - `leviathan` → **High Command**

---

## 1. The hero (landing page)
- [ ] Water renders — top-down waves, floating bottles/syringes drifting.
- [ ] Move the cursor over the water → it **ripples** out; nearby bottles drift away.
- [ ] Hover a bottle → it tips up + a **name chip** shows the drug name.
- [ ] The "We are ___" line **types itself** and cycles.
- [ ] Audio toggle (top-right) is **off by default**; turn it on → drips/creaks.
- [ ] **Join Us** → opens the Discord. **Apply Now** → opens the application form (new tab).

## 2. The puzzle → drain → login
- [ ] Drag the 4 labelled bottles into the tray slots. **Wrong order** → after a moment they float back out (no popup — that's intended).
- [ ] Get **3 of 4** right → something flickers in the deep briefly.
- [ ] Solve it (P-E-A-K) → everything freezes → the tank **drains** and the camera falls → a **loading screen** with facts → lands at **Employee Access** (`/login`).
- [ ] Reload the page → it should **not** drag you through the drain again (solved once per session). A fresh incognito window resets it.

## 3. The dive (scroll down)
- [ ] Scrolling **sinks** you — camera goes from top-down → level with the water → underwater. It should feel like a smooth camera move, not a jerky scrub.
- [ ] The **"We are The Redwood Co."** headline should NOT flicker on small scrolls.
- [ ] Scroll back to the very top → the puzzle is **playable again**.

## 4. The public sections (as you sink)
- [ ] **History** — types itself out the first time it's on screen; sits against the clear surface water.
- [ ] **Services** — 3 cards pop in with icons; each footed "Wholesale and contract inquiries only."
- [ ] **Media** — carousel auto-advances; **pauses while you hover it**. Two slides (cleanup + tanker) have a **black redaction bar** — you can read it if you squint. The panel is offset left so the **tanker/shore** shows on the right.
- [ ] **Contact** — you should be able to read the form clearly (fish visible in the deep behind it).

## 5. Contact form
- [ ] Discord username is **required** (Submit disabled until you type one).
- [ ] Submit → shows **"Inquiry #RW-XXXXX logged"**.
- [ ] If Supabase env vars are set: check the `contact_inquiries` table in the Supabase dashboard for the row. If not set: the reference still shows, nothing is stored (that's fine).

## 6. Login + tiers
Go to `/login` (or reach it via the puzzle). Test each:
- [ ] **Wrong name** (e.g. `banana`) → "That name is not on any list we keep." No redirect.
- [ ] `minnow` → lands in the portal as **Recruit**.
- [ ] `tidewater` → **Employee**. `leviathan` → **High Command**.
- [ ] Already signed in → `/login` shows an "Enter the portal →" shortcut.
- [ ] **Sign out** → back to `/login`, session cleared.
- [ ] While signed **out**, type `/portal` in the URL → you should be **bounced to `/login`**.

## 7. The portal (per tier)
Sign in as each tier and check what's unlocked vs locked (locked cards show a 🔒 + the clearance needed).
- **Recruit** unlocks: Orientation, Notices. (Everything else locked.)
- **Employee** adds: Personnel, Operations Log, Assignments.
- **High Command** adds: Witness Dossiers, Command.
- [ ] As Employee, put `/portal/command` in the URL → **bounced to `/login`** (guard works).

Then open each unlocked section:
- [ ] **Orientation** — checklist, core values, code of conduct (read to the end).
- [ ] **Notices** — "mark read" dims a notice.
- [ ] **Personnel** — org chart; one department is an unnamed box.
- [ ] **Operations Log** — the filter chips (All/Delivered/…) and the **Date ↕** sort actually change the table.
- [ ] **Assignments** — tapping a status cycles it open → in progress → done.
- [ ] **Witness Dossiers** — click a card → it opens as a **classified document** (stripe + ref number).
- [ ] **Command** — directives + the ledger (redacted counterparties, green in / red out). The **Purge** button just says "reconsider" — that's intended.

---

## Things that are **intended** (don't report these as bugs)
- Wrong puzzle order gives no error message — the bottles just drift back.
- The puzzle only plays once per session (reload won't replay it).
- Nothing in the portal saves — "mark read", task statuses, etc. reset on reload. It's set dressing.
- The 3D model files 404 in the console (`hero-bottle-*.glb`, `tanker.glb`) — those are placeholders; the shapes are drawn procedurally as a fallback.
- The ledger totals don't add up. On purpose.
- The company is deeply sinister. Also on purpose.

## How to report
If something breaks, the most useful thing is: **what you clicked + what happened** (and which browser). Screenshots help.

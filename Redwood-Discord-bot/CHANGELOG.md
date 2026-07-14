# Redwood Peak — Bot Changelog

## v1.6b — the doors open for business

the ledger had a promise attached to it: *orders, donations, and payroll all land here next.* here's the first half of that. the company grew a **public face** — a storefront the outside world can walk up to, place an order, or drop a donation — and, behind it, an **order pipeline** that carries a job from "someone asked" all the way to "paid," posting its own earnings onto the books when it's finished. no one has to remember to write the money down anymore; the work writes it down itself.

this is also the bot's first time listening for **buttons and pop-up forms**, not just slash commands. so a customer who's never touched a command can click one button and be talking to us.

### the storefront — `/storefront`
the shopfront window. one command, high-command only, that posts the thing the public actually sees.

- **`/storefront post channel:<#channel>`** — *high command only.* drops the public storefront embed into the channel you pick. the embed says who we are and that we're open, and carries two buttons: **Place an order** and **Donate**. run it wherever the public should see us (a #storefront or #front-desk channel).
  - to change the wording or re-post it, just run it again — it posts a **fresh** embed each time (editing an already-posted one isn't a thing yet). delete the old message if you don't want two.

on that embed, anyone — customer or member — can press:

- **🟦 Place an order** *(button)* — opens a **private ticket thread** off the storefront channel, named `order-<their name>`, adds the person who clicked, and **pings high command** so someone picks it up. the customer gets a quiet, only-they-can-see-it pointer to their new thread. this is also the moment a tracked **order** is created (see the pipeline below), and the order card is posted into the thread.
- **⬜ Donate** *(button)* — opens the donation form (below).

### donations — the Donate button
clicking **Donate** pops a small form:

- **Amount** *(required)* — whole dollars. `$` signs, commas, and stray spaces are fine (`$50,000`, `50000`, ` 1000 ` all work). decimals, zero, negatives, and words are rejected with a polite refusal and nothing gets written.
- **Name to credit** *(optional)* — leave it blank to give **anonymously**.

on submit:
- the amount is recorded to the **white book** as an inflow, tagged `donation`, with a reason of `Donation from <name>` or `Donation (anonymous)` — so `/ledger summary` stays readable.
- the donor gets a private thank-you only they can see.
- if a private donations-log channel is configured (`CHANNEL_DONATIONS`), a line is filed there for the record.
- **donations are private by default.** a **public** thank-you is posted in the storefront channel **only** for gifts of **$50,000 or more** — the donor named, or credited as "an anonymous benefactor" if they chose to stay quiet. small givers are never announced.

### the order pipeline — the card buttons + `/order`
every ticket opened by **Place an order** now has a real **lifecycle**, shown on a status card at the top of the thread:

```
open  →  claimed  →  fulfilled  →  done   (→ ledger inflow, tagged 'order')
   └────────┴───────────┴──────→  cancelled   (no money moves)
```

state only moves forward, or to **cancelled**. it never goes backward, and a **done** or **cancelled** order is frozen.

**work it with the buttons on the order card** (whoever's handling the job clicks them):
- **Claim** — take ownership. the card records you as the claimer and flips to *claimed*.
- **Fulfilled** — the work's done in-game; this pops a small form to enter the **amount collected** (whole dollars, same lenient parsing as donations). the card flips to *fulfilled* and shows the amount.
- **Done** — close it out. the amount **posts itself to the ledger** and the card flips to *done* (green) with its buttons removed.
- **Cancel** — kill the order. the card flips to *cancelled* (red). **no ledger entry.**

**or drive it from the keyboard with `/order`** — run these **inside the order's thread** (it finds the order by which thread you're in). a reliable mirror of the buttons:
- **`/order status`** — show the order's current card. anyone in the thread can run it (including the customer).
- **`/order claim`** — take ownership of this order. *(any active roster member.)*
- **`/order fulfill amount:<whole dollars>`** — mark it fulfilled and set the amount collected. *(any active roster member.)*
- **`/order done`** — close the order and post its earnings to the ledger. *(any active roster member.)* refuses if no amount is set yet — run `fulfill` first.
- **`/order cancel`** — cancel this order. *(the claimer or high command only.)*

**the money guarantee:** earnings post to the books **exactly once**. the ledger write is tied to the single `fulfilled → done` step, and once an order is *done* it can't go *done* again — so a job can never be paid twice. and if the ledger write ever fails, the order rolls back to *fulfilled* rather than sitting *done* with no money behind it. entries land on the **white book**, tagged `order`, reason `Order #<n> — <summary>`.

### setup / under the hood
- **one new table** — `orders` (with a human-readable order number). everything else rides rails already laid: the same two books, the same threads-and-buttons plumbing the storefront introduced.
- **permissions the bot needs** in the storefront channel: **Create Private Threads**, **Manage Threads**, and **Send Messages** (so it can open tickets and post cards).
- **optional env** — `CHANNEL_DONATIONS=<channel id>` turns on the private donations log. leave it unset and donations still record and still thank the donor; they just aren't filed to a log channel.
- **deploy** — run `db/schema-v1.6b.sql` once in Supabase, then `git pull && npm run build && pm2 restart redwood-bot --update-env`.
- **payroll** is the piece still owed from the ledger's promise. it lands on these same books next.

---

## v1.6 — the paper trail grows teeth

v1.0 gave the company a memory. this stretch gives it a *nervous system* — the records it was quietly hoarding are now searchable, cross-referenced, and worth money. plus a coat of polish so the whole thing stops looking like a bot and starts looking like an institution.

### the polish pass
- **every embed is themed now** — company red for the ordinary, a deeper red for denials, muted green for a job done, amber for a warning. you can tell how a command went by the color before you read a word.
- **the voice got tightened** everywhere — confirmations, denials, errors, all shorter and colder.
- **cover identities got names that match** — the fake papers now pick a first name that fits the person instead of pulling at random, so a cover reads like a real person and not a shuffled deck.

### `/lookup` — the police database
all those names, plates, and badges you've been logging on shift stop being a pile and become a **search**.
- `/lookup name:` / `plate:` / `badge:` — pull everyone and everything the company has on a person, vehicle, or officer: every incident they appeared in, when, where, alongside whom.
- it reads straight off the shift logs. the more the org works, the more it knows.

### the registries — `/registry`
the things the company owns and the things it's watching, written down.
- **assets, vehicles, properties, contacts** — each filed with its own record, cross-referenced against `/lookup`.
- add, view, and list, all clearance-gated. the org finally has an inventory instead of a vibe.

### reputation & the burn — `/rep`
people the company deals with earn a standing, and standing can be *revoked*.
- track reputation on a contact — trusted, watched, or marked.
- **burn a name** — when someone goes too hot, you torch the record and everything downstream knows they're radioactive. tied into identity rotation, so a burned cover actually burns.

### the media carousel
- the website's **Media** section now runs off the bot. `/carousel` manages the slides — the community-outreach stories, the fleet, the storefront — and the site pulls them live. no redeploy to change what the public sees.

### the ledger — `/ledger` *(v1.6a)*
the company keeps books now. two of them: a **white book** (clean, on the record) and a **black book** (off it). every entry is an inflow or an outflow with a reason and a source tag (`manual`, `donation`, `order`, …). both commands are **high command only**.

- **`/ledger record amount:<whole dollars> direction:<inflow|outflow> book:<white|black> reason:<text>`** — files a single entry by hand. `direction` and `book` are pick-lists; `amount` is whole dollars (minimum 1); `reason` is free text ("what for"). manual entries are tagged `source=manual`.
- **`/ledger summary`** — shows the balances on both books at a glance: inflow, outflow, and net for white and black, plus the most recent entries.

this is the foundation the economy sits on — donations and orders (v1.6b) post here automatically, and payroll lands here next.

### under the hood
- same shared supabase, same ubuntu box. new tables for lookups, registries, reputation, carousel slides, and the ledger — all gated by clearance, all feeding the website where it's safe to.

---

## v1.0 — the company, now wearing a bot

first real version. it's not a game and it's not a carl/dyno clone — it's the records-and-security layer wrapped around the ERLC roleplay, and it talks like the company: deadpan, over-polite, faintly threatening. every confirmation and error is in-voice. here's everything it does.

### the roster
the whole org structure, run through discord roles so nobody edits anything by hand.
- **ranks** — trainee → employee → supervisor → high command. **divisions** — security, research, intelligence. **positions** — trainee instructor, internal affairs, representative, media relations. each one is a real discord role.
- there's **one live roster message** the bot owns and redraws itself every time anything changes — grouped by rank, always current. `/roster-setup #channel` drops it.
- `/promote`, `/demote`, `/setrank`, `/division add|remove`, `/position add|remove`, `/dismiss`, `/whois`. every change re-syncs their discord roles and nickname so the roles always match the roster exactly.

### identities — `/identity`
onboarding is a ritual now. `/identity create @them name:<their rp name> rank:<rank>` does the whole thing in one motion: sets their nickname, gives them the rank role, files them on the roster, AND mints them a fake cover identity — a legal name, DOB, SSN, ID number, blood type, next of kin. the **name you type** is their real roleplay name from their application; the **cover** is a disposable fake (real formats, random numbers, made-up person — never a real one).
- `/identity rotate @them` — burn the old papers, mint a fresh cover, keep the person. for when a name gets too hot.
- `/identity view @them` — pull someone's current packet. high-command only, since it's got the sensitive stuff.
- this replaced the old `/hire` — getting hired and getting your identity are the same thing.

### shifts — `/shift` (the ankle monitor)
clock on, and the company knows where you were. or where you *said* you were.
- `/shift start` — go on duty.
- `/shift log summary: location:` — record an incident, and tack on who was involved right there (name, plate, officer badge).
- `/shift party` — add more people to that incident (a scene with several officers/civilians).
- `/shift end movements:` — close out. you account for the landmarks you passed; it stamps the duration and files everything.
- `/shift report` — an optional witness-dossier write-up.
- `/shift status` — where you're at.
- all those names/plates/badges you log quietly stack into a database — a `/lookup` "police database" that reads it is coming later. this is the groundwork.

### the security suite (themed as site security)
a genuinely competent mod bot, it just narrates everything like a paranoid company.
- **anti-raid** — a wave of joins trips an automatic lockdown. "unregistered personnel detected."
- **anti-spam** — flooding or mass-mentions gets you timed out.
- **intruder alerts** — brand-new accounts joining get flagged to the security channel.
- **mass-action alerts** — someone deletes a channel/role or bans/kicks in bulk, high command hears about it.
- **`/lockdown on|off`** — seal the server for an incident.
- **dead-man's switch** — if high command doesn't check in, it fires a "purge" *alert* (it only ever asks you to reconsider — nothing destructive).

### the website is live
the portal cards that used to be placeholder lore now open into real pages that read straight from the same database the bot writes to:
- **Personnel** — the live roster, grouped by rank.
- **Operations Log** — everyone's closed shifts as a timeline: who, how long, movements, the incidents.
- **Witness Dossiers** — recurring people/plates/badges pulled out of every incident, plus the filed reports.

### the small stuff
- **`/help`** — the employee handbook (a link to the real doc).
- **`/say`** — speak as the company in any channel. high command only.
- **the logger** — joins, leaves, message deletes and edits, all quietly filed to a log channel.

### under the hood / heads up
- shared supabase database with the website, self-hosted on an ubuntu box (pm2), commands gated by clearance.
- the fake IDs are random numbers in real formats attached to fictional characters — not anyone's actual anything, it's set dressing.
- the sensitive cover stuff (SSN, legal name) lives **only in discord** via `/identity view`. it never touches the website; the site only ever shows the safe stuff.
- it's fresh — if a command does something weird, tell me exactly what you ran 👀

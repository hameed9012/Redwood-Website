# Redwood Peak — Bot Changelog

## v1.6b — the doors open for business

the ledger had a promise attached to it: *orders, donations, and payroll all land here next.* here's the first half of that. the company now has a public face that takes work and takes money — and the money finds its own way onto the books.

### the storefront — `/storefront`
- `/storefront post #channel` drops a **public embed** — who we are, that we're open — with two buttons: **place an order** and **donate**.
- **place an order** opens a **private ticket thread**, pulls the customer in, and pings high command. the conversation happens where the public can't see it.

### donations
- **donate** pops a small form — an amount, and a name to credit or stay anonymous. on submit the sum lands on the **white book** as an inflow (tagged `donation`), and gets filed to a private donations channel.
- donations are **private by default**. a public thank-you only fires for the serious money — **$50,000 and up**. small givers stay quiet; big ones get named (or credited as "an anonymous benefactor" if they'd rather).

### orders that pay themselves — the pipeline
- an order ticket isn't just a chat anymore; it has a **lifecycle**: open → claimed → fulfilled → done. or **cancelled** from anywhere, in which case no money moves.
- work it with the buttons on the order card, or `/order claim | fulfill | done | cancel | status` for the keyboard crowd. **claim** takes ownership, **fulfilled** sets the amount collected, **done** closes it out.
- the instant it's **done**, the amount posts *itself* to the ledger — white book, tagged `order`, reason `Order #N — …`. exactly once: the books can never be hit twice for the same job, and if the ledger write chokes the order refuses to call itself done, so a finished order always has its money on it.
- every step redraws the order card in the thread, so anyone watching sees exactly where it stands.

### under the hood
- one new `orders` table; everything else rides rails already laid — the same books, the same buttons-and-threads plumbing. the bot's role needs **create / manage private threads** in the storefront channel, plus an optional `CHANNEL_DONATIONS` for the private donation log.
- payroll is the piece still owed. it lands on these same books next.

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

### the ledger — `/ledger`
the company keeps books now. two of them.
- **white book** (clean, on the record) and **black book** (off it). every entry is an inflow or an outflow with a reason and a source tag.
- `/ledger record` files an entry; `/ledger summary` shows the balances on both books at a glance.
- this is the foundation the economy sits on — orders, donations, and payroll all land here next.

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

# Redwood Peak — Bot Changelog

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

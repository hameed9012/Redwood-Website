# Redwood Peak — Changelog

## v0.4.0 — okay here's the whole thing so far

alright so i never wrote these up properly and the old changelogs were WAY too dramatic lmao, so i nuked all of them and this is one clean "from nothing to now" dump. if you're seeing the site for the first time, this is the entire tour in one place.

quick version: it's a (fake) pharma company site with a big underwater 3D hero, a hidden puzzle that unlocks a login, a scroll-dive down into the deep, the public pages (history / services / media / contact), and a secret-name login that drops you into a tiered employee portal. that's it. details below :D

### the hero — the water thing
the landing page is a real WebGL water tank, not a video.
- top-down view of open water with actual moving waves (hand-written shader, not a gif).
- bottles + syringes float around and drift on their own, each one bobbing and turning independently.
- move your cursor over the water and it ripples out from your pointer, and nearby stuff drifts away from the disturbance before settling.
- hover a bottle and it tips up so you can read the label — there's also a little name chip so you can actually tell what's what.
- the "we are ___" line types itself out and cycles (pharmaceutical company, logistics, camping gear, etc — all "true" ofc).
- there's a tanker parked on the far shore quietly dumping something into the water. don't worry about it.
- audio toggle in the corner (off by default) — drips, creaks, bubbles, never loops the same twice.
- it scales itself down on weaker hardware so it doesn't fall over on a budget phone.

### the puzzle — the hidden bit
there are 4 specific bottles: P, E, A, K.
- pick them up and drag them into the little row of 4 slots at the bottom.
- get the order right (read the labels 👀) and things happen.
- wrong order? they just quietly float back out. no popup, no "try again", no counter. nothing.
- get 3 of 4 right and something flickers in the deep for a sec.
- solve it and: everything freezes → the tank DRAINS out from under you and the camera falls with it → a loading screen with real chem/physics facts (a couple are… not real) → and it drops you at a login door.
- solve it once and your session remembers, so a refresh won't drag you through the whole drain again.

### the dive — scrolling = going underwater
scrolling down doesn't scroll a page, it sinks you.
- the whole 3D canvas is a fixed background now, and the camera flies from the top-down surface, tips level with the water, then drops under.
- it's a 3-stage move: surface (top-down) → a level shot looking across the water at the tanker on the shore → down into the deep.
- down there: fish drifting around, a scatter of extra bottles, and a few coffins way down on the bed. yeah.
- the descent eases now instead of being locked 1:1 to your scrollbar, so it feels like an actual camera move instead of a scrubber.

### the actual pages
these sit over the water as you sink past them:
- **History** — types itself out the first time you reach it. the company backstory (founded oct 2024, the "shell companies", all that).
- **Services** — 3 cards that pop in: Pharmaceutical Supply, Logistics, Camping Equipment. "wholesale and contract inquiries only."
- **Media** — a little auto-playing carousel (pauses when you hover it) of "community" stuff. two of the slides have black redaction bars over a line — you can read them if you squint.
- **Contact** — drop a discord name + optional message, get a fake inquiry number back. it actually saves to a database (supabase) if the keys are set, otherwise it just shows you the number and moves on.

### the login + portal — the members area
the drain drops you at Employee Access.
- type a secret name. if it's a real one you're in; if not, "that name is not on any list we keep." no hints, no lockout theatre.
- the names aren't stored anywhere in plaintext — only hashes. right now they're placeholder codenames, i'll swap the real ones in.
- three tiers: Recruit < Employee < High Command, each sees more than the last.
- you land in a portal that greets you by tier and shows a grid of sections (Orientation, Personnel, Ops Log, Witness Dossiers, etc). the ones above your clearance show up locked, so you can see there's more to reach.
- it remembers you until you sign out.
- (the portal sections themselves are placeholders for now — those get filled in later phases.)

### NEW: applications are OPEN
we finished the application form, so the old "applications opening soon" button is now a live **Apply Now** that goes straight to the form. the Join Us button still opens the discord.

### under the hood / the pile of fixes
a bunch of stuff got fixed getting here: the water canvas hiding behind the page background, the hero headline vanishing on tiny scrolls, scroll jank, the puzzle breaking once the canvas became a full-page background, parked bottles landing off their slots, a busted media post, the deep being pitch black so you couldn't see the fish, and generally getting the whole thing to a steady 60fps.

### if you're poking around
break everything. if something looks wrong, telling me exactly what you clicked and what it did is genuinely the most useful thing you can send me. and go find the stuff that isn't obvious 👀

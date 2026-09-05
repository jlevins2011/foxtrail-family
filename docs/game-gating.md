# Follow-ups in each game repo

Stay inside **foxtrail-family**.

Do **not** clone, open, edit, or open PRs against:

- https://github.com/jlevins2011/state-capitals (Camp Compass — owner is actively working there)
- https://github.com/jlevins2011/typing-game (Keytrail)
- https://github.com/jlevins2011/HS-Game-v1 (Lumen Isles)

The hub **does not fork or copy** those games. Play buttons link out only:

- Camp Compass → https://jlevins2011.github.io/state-capitals/
- Keytrail → https://jlevins2011.github.io/typing-game/
- Lumen Isles → https://jlevins2011.github.io/HS-Game-v1/

Today those Pages builds are fully playable. The hub labels outbound buttons **Play demo** and notes that a hard gate is a later change **the owner can make inside each game**.

Do not add Spencer-Game / Homeschool-Game-v1 (CraftWorlds) to this hub.

## Shared idea (hub side only)

1. Hub already knows if a family is subscribed (Clerk public metadata, set by the Stripe webhook).
2. After unlock, the parent is signed in on the hub.
3. Each game still needs its own check if you want a *hard* demo vs full split — that work happens in those repos, not here.

A later, small contract (do not implement in the game repos from this agent):

- Hub issues a short-lived signed token (or query param) when a subscribed parent opens **Play**.
- Each game verifies that token (shared secret or public key) and unlocks the full trail.
- Without a valid token, the game stays in a real demo: one camp, first typing lessons, or a single island.

Until that lands, both demo and library buttons open the same live Pages URL. That is intentional and documented in the UI.

## Notes for later (owner-owned game repos)

These are reminders only. Do not implement them from foxtrail-family.

**Camp Compass** — one region as a hard demo; full five-camp map after a valid family token.

**Keytrail** — home-row intro as a hard demo; later trails after unlock.

**Lumen Isles** — first island / limited tools as a hard demo; full loop after unlock.

## Out of scope on the hub

- Opening or editing the three game repositories
- Apple IAP
- Child emails
- Ads or chat
- Copying game engines into this repository

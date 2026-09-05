# Follow-ups in each game repo

The hub **does not fork or copy** Camp Compass, Keytrail, or Lumen Isles. Cards link out to the live GitHub Pages URLs.

Today those Pages builds are fully playable. The hub labels outbound buttons **Play demo** and notes that a hard gate is a later change **inside each game**.

Do not add Spencer-Game / Homeschool-Game-v1 (CraftWorlds) to this hub.

## Shared idea

1. Hub already knows if a family is subscribed (Clerk public metadata, set by the Stripe webhook).
2. After unlock, the parent is signed in on the hub.
3. Each game still needs its own check if you want a *hard* demo vs full split.

A later, small contract:

- Hub issues a short-lived signed token (or query param) when a subscribed parent opens **Play**.
- Each game verifies that token (shared secret or public key) and unlocks the full trail.
- Without a valid token, the game stays in a real demo: one camp, first typing lessons, or a single island.

Until that lands, both demo and library buttons open the same live URL. That is intentional and documented in the UI.

## Camp Compass (`state-capitals`)

Suggested hard demo:

- One region (for example Northeast) and a short stone collection.
- Full five-camp map + parent PIN reports after a valid family token.

Repo: https://github.com/jlevins2011/state-capitals

## Keytrail (`typing-game`)

Suggested hard demo:

- Home-row intro and the first trail only.
- Later trails, glow, gloom, and saved WPM after unlock.

Repo: https://github.com/jlevins2011/typing-game

## Lumen Isles (`HS-Game-v1`)

Suggested hard demo:

- First island / limited tools.
- Full explore-build-shine loop after unlock.

Repo: https://github.com/jlevins2011/HS-Game-v1

## Out of scope on the hub

- Apple IAP
- Child emails
- Ads or chat
- Copying game engines into this repository

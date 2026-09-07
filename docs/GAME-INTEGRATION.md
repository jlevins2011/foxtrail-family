# Game integration contract

`game-releases.json` pins the four reviewed source commits. `scripts/package-games.mjs` copies source into `.game-builds`, applies small host adapters, and emits `game-dist`. Game repositories are never edited by packaging. Public assets live behind `/api/games/:game/:asset` instead of a publicly bypassable full-game directory.

On game entry the server authenticates the family, child, membership, and (when enabled) island-time lease. It injects an escaped boot object containing the selected profile, compatible learning plan, banks, saved state, and earned treasure entitlements. The host bridge loads before the game engine.

The bridge presents only the selected child to each game and redirects profile/parent setup to the hub. It hydrates game state from server storage and uploads changes with an explicit child ID. An old tab cannot write its save under a newly selected sibling. The local browser cache is not the source of truth. Progress remains separate by game.

The native games retain their campaign systems. Explicit bank selections override supported question formats through adapters; the assigned trail handles arbitrary prompts and answers. Subject filtering happens on the server. Lumen uses its existing FamilyServices provider to consume the shared curriculum.

## Reward sources

Assigned challenges are issued by the server, expire after ten minutes, can be answered once, and award at most 100 verified-answer credits per child per rolling 24 hours. Lumen’s own questions never earn cross-game discovery credits.

Native learning games upload completed-session evidence bound to a two-hour game ticket, family, child, and game. Records are idempotent. Qualified completions earn one credit per five correct inputs, capped at three credits per lesson per day and 30 native credits per rolling 24 hours. Records are explicitly game-reported. A competitive or monetary economy would require stronger server-validated gameplay protocols.

Treasure entitlements are derived from total discovery credits. The three lights have unique native build-piece IDs and require entitlement flags derived from the family wallet. Their materials cannot grant credits. Island time uses separate, atomic minute charges, so spending playtime does not remove earned treasures. The embedded game checks its own lease as well as the website wrapper.

## Adding a game

1. Add a catalog entry and stable game ID to `src/config/games.ts`.
2. Add its supported subjects to the server capability registry in `src/lib/platform/model.ts` and the matching parent UI registry. Add supported question formats explicitly.
3. Add a packaging adapter, storage-key namespace, and release commit. Do not mutate existing game IDs or storage keys.
4. Bind any learning receipt to the family, child, game, and idempotent event ID. Never accept a client-supplied wallet balance.
5. Test unsupported-subject rejection, save isolation, entitlement checks, parent-control routing, and old-save loading.

Built-in game saves were originally device-local. This release starts new hub-linked saves; it does not silently import historical standalone-browser profiles. A deliberate migration/import flow can be added later if needed.

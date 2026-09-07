# Foxtrail Family · testing release

A shared home for **Sumtrail, Camp Compass, Keytrail, and Lumen Isles**. Foxtrail is a working name; rename it in `src/config/brand.ts` and set the public origin in the environment.

## Try it locally

Requires Node 24 and npm.

```sh
npm ci --ignore-scripts
npm run dev:test
```

Open http://127.0.0.1:3000/sign-in and choose **Open testing family**. Create your own 6–10 digit parent PIN, then add children with four-digit child PINs. No service accounts or payment cards are needed. The local testing family is stored in `data/family.sqlite` and survives restarts.

The special testing sign-in is disabled whenever `NODE_ENV=production`, regardless of the testing flag. Local testing accounts have owner controls so you can exercise permissions. Production owners are explicitly allowed by `FOXTRAIL_OWNER_IDS`.

## Included

- Up to six children, shared grade, syllabus notes, subject choices, and bank assignments; optional per-game course overrides.
- A parent PIN gate, throttled attempts, expiring parent access, and automatic parent locking when a child starts playing.
- Editable built-in banks; manual entry; CSV/JSON import and export; private copies shared by revocable codes. No customer AI features or AI usage costs.
- Game saves in the family database, separated by family, child, and game.
- Verified assigned-trail questions, capped credits from completed native lessons, three learning-exclusive island lights, and optional earned island playtime.
- A 14-day card-free family trial, a permanent limited-practice tier, and Stripe monthly/annual subscription wiring. Initial configurable prices: $9.99 monthly or $99.90 annually.
- Crawlable game pages, canonical URLs, metadata, structured learning-resource descriptions, a sitemap, and noindex on private routes.
- Owner-managed agent keys with explicit scopes, expiry, revocation, and an audit log.

See [START TESTING](docs/START-TESTING.md), [LAUNCH SETUP](docs/LAUNCH-SETUP.md), and [game integration](docs/GAME-INTEGRATION.md).

## Checks

```sh
npm run typecheck
npm run test:bridge
npm test
npm run build
```

The platform test starts an isolated development server on 127.0.0.1:3117 with a temporary database. It does not touch your testing family. The bridge test uses a simulated JavaScript environment; it is not a browser gameplay test. Real Stripe transactions and Clerk sign-in require the account setup in the launch guide.

## Game releases

The `game-dist` directory contains the packaged release of each playable game. `game-releases.json` records its exact source commit. The original repositories remain independent and unchanged.

To upgrade: place clean checkouts of the four game repositories next to this repository, install each game's dependencies, and run `npm run games:package`. Set `FOXTRAIL_GAMES_ROOT` if they live elsewhere. The packaging script copies source into ignored build directories, applies the family integration, and fails if a known integration point has changed. Review the resulting game diff, run checks, and commit the new release. See the integration guide before changing those adapters.

## Deployment architecture

Next.js with Clerk and Stripe, on a **single Node 24 server with a persistent SQLite disk**. The Dockerfile and `render.yaml` package this model. Do not deploy this version to ephemeral/serverless filesystem hosts or multiple replicas sharing no disk. Back up the database before changes and regularly in operation.

This is an existing Next.js application with Node SQLite persistence, not a Cloudflare Worker. Sites hosting cannot run this server build; no empty or static-only version was published as a substitute. Use the included Node deployment setup. No domain or host account has been connected yet.

The existing standalone GitHub Pages games remain available outside this website. Before commercial launch, decide whether to limit or retire those standalone deployments. The family hub gates its own full-game routes; it cannot gate the separate public URLs.

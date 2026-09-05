# Foxtrail Family

A family hub for three kid educational games — **Camp Compass**, **Keytrail**, and **Lumen Isles** — behind one parent-held paywall, with Add to Home Screen / PWA support.

Working name is **Foxtrail Family** (Pip the lantern fox appears in Camp Compass and Keytrail; Lumen is the sibling). Rename the product from a single file: [`src/config/brand.ts`](src/config/brand.ts). Game URLs live in [`src/config/games.ts`](src/config/games.ts).

This repository does **not** fork, clone, or edit those games. The hub **only** links out to their live GitHub Pages sites. Do not open PRs against `state-capitals`, `typing-game`, or `HS-Game-v1` from this project.

| Game | Subject | Play (hub links here only) |
| --- | --- | --- |
| Camp Compass | US geography | https://jlevins2011.github.io/state-capitals/ |
| Keytrail | Typing | https://jlevins2011.github.io/typing-game/ |
| Lumen Isles | 3D island adventure | https://jlevins2011.github.io/HS-Game-v1/ |

Spencer-Game / Homeschool-Game-v1 (CraftWorlds) is intentionally **not** on this hub.

## What parents see

- **Public home + game landings:** crawlable pages for the hub, Camp Compass, Keytrail, and Lumen Isles. Each card has **Play demo** (the live Pages URL). Demos stay free.
- **14-day full-family trial, then pay:** Stripe Checkout for one family SKU — **$9.99 / month** or **$79 / year**. The library is not free forever.
- **After trial or subscribe (signed-in parent):** `/library` with full-library play links plus iPad Add to Home Screen steps.
- **Parent dashboard:** subscription status, Stripe billing portal, and a **Question banks — coming soon** stub.

v1 is COPPA-aware: **parent email only**. No child accounts on the hub, no ads, no chat, no Apple IAP, no invented analytics.

## Stack

- Next.js App Router + TypeScript
- Clerk (email magic-link auth)
- Stripe Checkout + webhooks + Customer Portal
- Web app manifest + a light service worker

The public hub builds and runs without Clerk or Stripe keys. Auth and billing routes show setup copy until the env vars below are set.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000. `npm run build` should succeed with or without keys.

### 1. Clerk magic-link

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the publishable key and secret key into `.env.local`.
3. Under **User & authentication**:
   - Enable **Email** as an identifier.
   - Enable **Email verification link** (magic link).
   - Turn off passwords (and social/phone) if you want email-link only.
4. Set paths to `/sign-in` and `/sign-up` (already listed in `.env.example`).
5. Add your production domain in Clerk before going live.

A parent enters their email, opens the link, and lands on the library (or unlock, for a new account).

### 2. Stripe products (test mode)

Use the Stripe **test** dashboard first (`sk_test_…`, `pk_test_…`).

1. Create one product: **Foxtrail Family** (or your renamed brand).
2. Add two recurring prices on that product:
   - Monthly: **$9.99 USD** / month → copy the price id to `STRIPE_PRICE_MONTHLY` (`price_…`)
   - Yearly: **$79 USD** / year → copy the price id to `STRIPE_PRICE_YEARLY`
3. Enable the [Customer Portal](https://dashboard.stripe.com/test/settings/billing/portal) so parents can update cards and cancel.
4. Webhook endpoint: `https://YOUR_DOMAIN/api/webhooks/stripe`
   - Local: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
5. Subscribe the webhook to at least:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
6. Put the webhook signing secret in `STRIPE_WEBHOOK_SECRET` (`whsec_…`).

Checkout path: parent signs in → `/unlock` → monthly or yearly → Stripe Checkout **with a 14-day trial** → `/unlock/success` → webhook writes `trialing` / `active` onto the Clerk user (`publicMetadata`) → `/library` unlocks. After the trial, the chosen price bills unless they cancel in the portal.

Card testing in test mode: `4242 4242 4242 4242`, any future expiry, any CVC.

### 3. Live Stripe keys

When you are ready for real charges:

1. Recreate the same product and prices in the Stripe **live** dashboard (or promote the existing catalog).
2. Replace `sk_test_` / `pk_test_` with `sk_live_` / `pk_live_`.
3. Add a **live** webhook to `/api/webhooks/stripe` and a new `whsec_` secret.
4. Confirm `NEXT_PUBLIC_APP_URL` is your production origin.
5. Keep test keys out of production hosts.

No Apple In-App Purchase. iPad families use the web checkout and the home-screen icon.

## Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Stripe redirects | No trailing slash |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth | `pk_test_…` or `pk_live_…` |
| `CLERK_SECRET_KEY` | Auth + webhooks | Server only |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Auth | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Auth | `/sign-up` |
| `STRIPE_SECRET_KEY` | Checkout, portal, webhooks | `sk_test_…` first |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional client use | `pk_test_…` |
| `STRIPE_PRICE_MONTHLY` | Checkout | `price_…` for $9.99/mo |
| `STRIPE_PRICE_YEARLY` | Checkout | `price_…` for $79/yr |
| `STRIPE_WEBHOOK_SECRET` | Webhook | `whsec_…` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Privacy page | Optional |
| `FOXTRAIL_DEV_UNLOCK` | Local preview only | `true` pretends the family is subscribed. Never on in production. |

## Game link config

Edit [`src/config/games.ts`](src/config/games.ts) to change names, blurbs, or URLs. Do not vendor game source here.

Brand strings, mascots, and colors: [`src/config/brand.ts`](src/config/brand.ts). Colors are injected as CSS variables on `<html>`.

Prices and trial length: [`src/config/pricing.ts`](src/config/pricing.ts). Checkout sends `trial_period_days: 14` on first subscribe. The charged amount always comes from the Stripe price ids.

Enable trials on the Stripe prices (or allow Checkout to set trial days). In the Customer Portal, let parents cancel before the trial ends if they do not want the first charge.

## SEO (public pages)

Indexable landings (also listed in `/sitemap.xml`; `/robots.txt` allows them):

| Page | Title focus |
| --- | --- |
| `/` | Foxtrail Family hub |
| `/games` | Three-game index |
| `/games/camp-compass` | Camp Compass |
| `/games/keytrail` | Keytrail |
| `/games/lumen-isles` | Lumen Isles |
| `/unlock` | 14-day trial + pricing |
| `/install` | Add to Home Screen |
| `/privacy` | Privacy |

Each of those has a unique title, meta description, H1, and Open Graph tags. Pages are server-rendered / static HTML — not an empty client shell. `/dashboard`, `/library`, and `/api` are noindex.

## Question banks (architecture only)

Shared, family-scoped lists (spelling, Latin, math facts, custom) that **any game can opt into later**. Not a database per game.

- Types: [`src/lib/question-banks/types.ts`](src/lib/question-banks/types.ts)
- Empty store: [`src/lib/question-banks/store.ts`](src/lib/question-banks/store.ts)
- Parent UI stub: `/dashboard/question-banks`
- Notes: [`docs/question-banks.md`](docs/question-banks.md)

Do **not** build game adapters in `state-capitals`, `typing-game`, or `HS-Game-v1` from this repo.

## PWA / iPad home screen

- Manifest: `src/app/manifest.ts` → `/manifest.webmanifest`
- Icons: `public/icons/` (SVG plus 192 / 512 / 180 PNG placeholders)
- Service worker: `public/sw.js` (shell cache, skips `/api` and Clerk)
- Parent-facing steps: `/install` and the unlocked `/library`

On iPad, open the hub in **Safari**, tap Share, then **Add to Home Screen**.

Regenerate PNG placeholders after you drop in final art:

```bash
node scripts/generate-icons.mjs
```

## Game-repo follow-ups

Hard demo vs full play is **not** enforced by this hub yet. Notes live in [docs/game-gating.md](docs/game-gating.md). Implement those later **in the game repos themselves**, not from this project — especially not in `state-capitals` while that repo is being edited elsewhere.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Privacy stance

Parent email via Clerk. Payment via Stripe. No ads, no chat, no child emails on the hub, no invented analytics pixels. The three games remain on GitHub Pages with their own parent PIN reports where those games already have them.

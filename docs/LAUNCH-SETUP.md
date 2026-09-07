# Launch setup

The current release is ready to run locally. A public test site needs a hosting account and sign-in keys. Real subscriptions also need Stripe.

## 1. Choose a working name and support address

Edit `src/config/brand.ts`. The name and colors are centralized. Set `NEXT_PUBLIC_SUPPORT_EMAIL` and `NEXT_PUBLIC_APP_URL` on the host. A temporary host-provided HTTPS address is sufficient; a custom domain can be added later. Rebuild whenever a `NEXT_PUBLIC_` value changes.

Review the privacy page and write your business terms before inviting public customers. The privacy text describes this implementation; it does not certify legal compliance. Decide how parent consent, account deletion, billing record retention, backups, and support will operate.

## 2. Create a parent sign-in application

Create a Clerk application. Enable email sign-in (email links or codes). Children do not need Clerk accounts. Copy the publishable and secret keys to your host; never commit them.

Set the sign-in path to `/sign-in`, sign-up path to `/sign-up`, and successful sign-in destination to `/dashboard`. Register your test site's origin in Clerk. Use Clerk test keys while privately testing.

Sign in as yourself, find your Clerk user ID in the Clerk dashboard, and put that ID in `FOXTRAIL_OWNER_IDS`. Only listed IDs get owner controls in production. A display name or email entered in the website does not grant owner access.

The separate parent PIN protects settings when a parent leaves their account signed in for children. Selecting a child revokes the parent session. Keep your email account and signed-in parent devices secure.

## 3. Deploy to a persistent Node server

The included Render blueprint describes a single Docker web service with a persistent disk. You can instead use any host that provides Node 24, a persistent writable disk, HTTPS, and a single application replica.

Connect the `foxtrail-family` GitHub repository to your chosen host and deploy the testing-release branch. For Render, use a Blueprint deployment from `render.yaml`. A persistent disk may require a paid hosting plan; choose and review that in the host's own interface.

Required environment values:

- `NODE_ENV=production`
- `FOXTRAIL_TEST_MODE=false`
- `FOXTRAIL_DATABASE_PATH=/var/data/family.sqlite`
- `NEXT_PUBLIC_APP_URL=https://YOUR-HOST-ADDRESS`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
- `FOXTRAIL_OWNER_IDS` with your Clerk user ID
- `NEXT_PUBLIC_SUPPORT_EMAIL`

The Docker build needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_SUPPORT_EMAIL` as build arguments. Configure these in the host's Docker build settings (Render exposes service environment values as build arguments declared in the Dockerfile). Secret server keys must be runtime environment values, not build arguments.

Mount the disk at `/var/data`. Do not use an ephemeral filesystem, Vercel-style serverless functions, GitHub Pages, or the Sites Cloudflare Worker runtime for this SQLite server build. More than one replica needs a database architecture change.

## 4. Connect Stripe test mode

Create one family membership product with two recurring USD prices matching `src/config/pricing.ts`:

- Monthly: $9.99 per month.
- Yearly: $99.90 per year.

Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, and `STRIPE_PRICE_YEARLY`. Use test-mode keys first. The backend checks the actual Stripe price, currency, and billing interval against the displayed price before opening checkout.

Create the webhook at `https://YOUR-HOST-ADDRESS/api/webhooks/stripe`. Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

Enable Stripe Customer Portal for payment updates and cancellation. Test monthly and yearly checkout, cancellation, payment failure, webhook retries, and a return visit after a trial expires. Membership access is reconciled from Stripe’s current subscription state; the success page alone never grants access.

The card-free trial starts on first family-account use and lasts 14 days. Subscribing does not restart it. Stripe can use the remaining trial when at least 48 hours remain; otherwise checkout bills immediately and displays the payment date. The pricing page explains this.

Before accepting real payments, configure matching live-mode prices and a live webhook, replace test secrets, confirm billing/tax settings in Stripe, and run a real end-to-end checkout with your own account.

## 5. Backup and operational routine

The database contains child profiles and game saves. Restrict host access and protect backups accordingly. Run `node scripts/backup.mjs /path/to/backup.sqlite` with `FOXTRAIL_DATABASE_PATH` set. It uses SQLite’s backup API for a consistent snapshot. Keep copies off the application disk and verify a restore to a separate testing deployment.

Do not delete `data/` to reset a running customer site. Local test data can be removed only when you intentionally want a fresh local family. Existing tables are initialized idempotently; future database changes should be versioned migrations with tested backups.

Agent keys use three scopes: aggregate report reads, official catalog reads, and new official-bank publishing. Agents cannot change permissions, bill customers, edit child profiles, or issue refunds. Add new capabilities deliberately with server checks and audit records; a toggle alone must never be the security boundary.

## Before inviting testers

- Confirm testing sign-in returns 404 in production.
- Create two separate parent accounts and verify they cannot see each other’s private records.
- Play each game on the actual tablet/computer families will use.
- Try switching children, closing the page, and resuming saves.
- Test both unrestricted and earned island time, including a lost network connection.
- Confirm your support contact, privacy text, and account-deletion process.
- Decide whether to limit or retire the old standalone GitHub Pages games before charging for full access. They are separate deployments and were not changed by this release.

Official setup references: [Clerk Next.js setup](https://clerk.com/docs/nextjs/getting-started/quickstart), [Stripe subscriptions](https://docs.stripe.com/billing/subscriptions/overview), [Stripe webhooks](https://docs.stripe.com/webhooks), [Render persistent disks](https://render.com/docs/disks).

function present(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

export function isClerkConfigured() {
  return (
    present(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    present(process.env.CLERK_SECRET_KEY)
  );
}

export function isStripeConfigured() {
  return (
    present(process.env.STRIPE_SECRET_KEY) &&
    present(process.env.STRIPE_PRICE_MONTHLY) &&
    present(process.env.STRIPE_PRICE_YEARLY)
  );
}

export function isStripeWebhookConfigured() {
  return present(process.env.STRIPE_WEBHOOK_SECRET);
}

export function isDevUnlockEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.FOXTRAIL_DEV_UNLOCK === "true"
  );
}

export function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function getPublishableStripeKey() {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
}

export function missingSetup(): string[] {
  const missing: string[] = [];
  if (!isClerkConfigured()) missing.push("Clerk magic-link keys");
  if (!isStripeConfigured()) missing.push("Stripe Checkout prices");
  return missing;
}

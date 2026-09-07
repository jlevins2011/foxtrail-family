import Stripe from "stripe";
import { familySku, getPlan, type PlanId } from "@/config/pricing";
import { isStripeConfigured } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function getPriceId(plan: PlanId) {
  const config = getPlan(plan);
  if (!config) {
    throw new Error(`Unknown plan: ${plan}`);
  }
  const priceId = process.env[config.envPriceId];
  if (!priceId) {
    throw new Error(`${config.envPriceId} is not set`);
  }
  return priceId;
}

export function assertStripeReady() {
  if (!isStripeConfigured()) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, and STRIPE_PRICE_YEARLY.",
    );
  }
}

export function inferPlanFromSubscription(
  subscription: Stripe.Subscription,
): PlanId | null {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_MONTHLY) return "monthly";
  if (priceId === process.env.STRIPE_PRICE_YEARLY) return "yearly";
  return null;
}

export function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const fromItem = subscription.items.data[0]?.current_period_end;
  if (typeof fromItem === "number") return fromItem;
  const legacy = (subscription as { current_period_end?: number })
    .current_period_end;
  return typeof legacy === "number" ? legacy : null;
}

export function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
    default:
      return "incomplete";
  }
}

export const stripeProductCopy = familySku;

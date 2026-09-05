import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { isClerkConfigured, isStripeWebhookConfigured } from "@/lib/env";
import {
  getStripe,
  getSubscriptionPeriodEnd,
  inferPlanFromSubscription,
  mapStripeStatus,
} from "@/lib/stripe";
import { findClerkUserId, saveFamilyBilling } from "@/lib/subscription";

export const runtime = "nodejs";

async function applySubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null,
  fallbackEmail?: string | null,
) {
  const clerkUserId = await findClerkUserId({
    userId:
      fallbackUserId ??
      (typeof subscription.metadata.clerkUserId === "string"
        ? subscription.metadata.clerkUserId
        : null),
    email: fallbackEmail,
  });

  if (!clerkUserId) {
    console.warn("Stripe webhook: no Clerk user for subscription", subscription.id);
    return;
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  await saveFamilyBilling(clerkUserId, {
    status: mapStripeStatus(subscription.status),
    plan: inferPlanFromSubscription(subscription),
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : null,
  });
}

export async function POST(request: Request) {
  if (!isStripeWebhookConfigured() || !isClerkConfigured()) {
    return NextResponse.json(
      { error: "Webhook secrets or Clerk are not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription" || !session.subscription) {
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscription(
          subscription,
          session.client_reference_id ?? session.metadata?.clerkUserId,
          session.customer_details?.email ?? session.customer_email,
        );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionRef = (
          invoice as Stripe.Invoice & {
            subscription?: string | Stripe.Subscription | null;
          }
        ).subscription;
        if (!subscriptionRef) break;
        const subscriptionId =
          typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscription(
          subscription,
          null,
          invoice.customer_email,
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler failed", error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

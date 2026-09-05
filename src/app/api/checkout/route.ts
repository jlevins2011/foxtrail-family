import { NextResponse } from "next/server";
import { getPlan, type PlanId } from "@/config/pricing";
import { getViewer } from "@/lib/auth";
import { getAppUrl, isStripeConfigured } from "@/lib/env";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getFamilyBilling } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer || viewer.isDevPreview) {
    return NextResponse.json(
      {
        error: viewer?.isDevPreview
          ? "Dev unlock is on. Turn off FOXTRAIL_DEV_UNLOCK to use Stripe Checkout."
          : "Sign in with a parent email first.",
      },
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe is not configured. Add STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, and STRIPE_PRICE_YEARLY.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { plan?: PlanId } | null;
  const plan = getPlan(body?.plan ?? "");
  if (!plan) {
    return NextResponse.json({ error: "Choose monthly or yearly." }, { status: 400 });
  }

  const billing = await getFamilyBilling(viewer.userId);
  const stripe = getStripe();
  const appUrl = getAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: getPriceId(plan.id), quantity: 1 }],
    success_url: `${appUrl}/unlock/success`,
    cancel_url: `${appUrl}/unlock/canceled`,
    client_reference_id: viewer.userId,
    customer: billing.stripeCustomerId ?? undefined,
    customer_email: billing.stripeCustomerId ? undefined : (viewer.email ?? undefined),
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    metadata: {
      clerkUserId: viewer.userId,
      plan: plan.id,
    },
    subscription_data: {
      metadata: {
        clerkUserId: viewer.userId,
        plan: plan.id,
      },
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: "Stripe did not return a checkout URL." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: session.url });
}

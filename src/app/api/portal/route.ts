import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { getAppUrl, isStripeConfigured } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { getFamilyBilling } from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST() {
  const viewer = await getViewer();
  if (!viewer || viewer.isDevPreview) {
    return NextResponse.json(
      { error: "Sign in with a parent email first." },
      { status: 401 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 503 },
    );
  }

  const billing = await getFamilyBilling(viewer.userId);
  if (!billing.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer yet. Unlock the family first." },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: billing.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}

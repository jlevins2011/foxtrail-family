import { requireConsent } from "@/lib/platform/privacy";
import {readJson} from "@/lib/platform/http";
import { NextResponse } from "next/server";
import { getPlan } from "@/config/pricing";
import { getAppUrl, isStripeConfigured } from "@/lib/env";
import { getPriceId, getStripe } from "@/lib/stripe";
import { requireParent, sameOrigin } from "@/lib/platform/security";
import { family, saveFamily, rate, Problem } from "@/lib/platform/model";
import { atomic, log } from "@/lib/platform/db";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const viewer = await requireParent();
    if (viewer.isDevPreview || !isStripeConfigured())
      throw new Problem(
        "Payments are not connected in local testing. Your testing family can explore without a card.",
        503,
      );
    requireConsent(viewer.userId,viewer.email);
    rate("checkout:" + viewer.userId, 10, 3600000);
    const b = await readJson(req,2048);
    const plan = getPlan(typeof b.plan === "string"?b.plan:"");
    if (!plan) throw new Problem("Choose monthly or yearly.");
    const f = family(viewer.userId);
    if (
      f.billing &&
      ["active", "trialing", "past_due", "incomplete", "unpaid"].includes(
        f.billing.status,
      )
    )
      throw new Problem(
        "This family already has a membership. Use Manage billing to change it.",
        409,
      );
    const stripe = getStripe();
    if (f.checkoutId && f.checkoutExpires && f.checkoutExpires > Date.now()) {
      const old = await stripe.checkout.sessions.retrieve(f.checkoutId);
      if (old.status === "open" && old.url) {
        if (f.checkoutPlan === plan.id)
          return NextResponse.json({ url: old.url });
        await stripe.checkout.sessions.expire(old.id);
      }
      if (old.status === "complete")
        throw new Problem(
          "Your membership is being confirmed. Please refresh shortly.",
          409,
        );
    }
    const price = await stripe.prices.retrieve(getPriceId(plan.id));
    if (
      !price.active ||
      price.unit_amount !== plan.amountCents ||
      price.currency !== "usd" ||
      price.recurring?.interval !== (plan.id === "monthly" ? "month" : "year")
    )
      throw new Problem(
        "The membership price needs an owner update before checkout.",
        503,
      );
    const customer =
      f.billing?.customer ||
      (
        await stripe.customers.create(
          { email: viewer.email ?? undefined, metadata: { familyId: f.id } },
          { idempotencyKey: "family-customer:" + f.id },
        )
      ).id;
    const trialEnd = Math.floor((f.trialStart + 14 * 86400000) / 1000);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: getAppUrl() + "/unlock/success",
        cancel_url: getAppUrl() + "/unlock/canceled",
        client_reference_id: f.id,
        metadata: { familyId: f.id, plan: plan.id },
        subscription_data: {
          metadata: { familyId: f.id, plan: plan.id },
          ...(trialEnd > Date.now() / 1000 + 48 * 3600
            ? { trial_end: trialEnd }
            : {}),
        },
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      },
      {
        idempotencyKey:
          "family-checkout:" +
          f.id +
          ":" +
          Math.floor(Date.now() / (30 * 60000)),
      },
    );
    if (!session.url)
      throw new Problem("Checkout did not open. Please try again.", 502);
    atomic(() => {
      const next = family(f.id);
      next.checkoutId = session.id;
      next.checkoutPlan = plan.id;
      next.checkoutExpires = session.expires_at * 1000;
      saveFamily(next);
    });
    log(f.id, "billing.checkout", plan.id);
    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Problem
            ? e.message
            : "Checkout is temporarily unavailable.",
      },
      { status: e instanceof Problem ? e.status : 500 },
    );
  }
}

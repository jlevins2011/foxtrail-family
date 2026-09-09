import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  getSubscriptionPeriodEnd,
  inferPlanFromSubscription,
  mapStripeStatus,
} from "@/lib/stripe";
import { family, saveFamily } from "@/lib/platform/model";
import { atomic, database, log } from "@/lib/platform/db";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY)
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  try {
    const object = event.data.object;
    let subId: string | undefined;
    let checkout = false;
    if (event.type === "checkout.session.completed") {
      const s = object as Stripe.Checkout.Session;
      if (s.mode === "subscription") {
        subId =
          typeof s.subscription === "string"
            ? s.subscription
            : s.subscription?.id;
        checkout = true;
      }
    } else if (event.type.startsWith("customer.subscription."))
      subId = (object as Stripe.Subscription).id;
    else if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
    ) {
      const i = object as Stripe.Invoice;
      const ref = i.parent?.subscription_details?.subscription;
      subId = typeof ref === "string" ? ref : ref?.id;
    }
    if (!subId) return NextResponse.json({ received: true });
    // Retrieve current Stripe state so delayed update events cannot restore old access.
    const sub = await stripe.subscriptions.retrieve(subId),
      owner = sub.metadata.familyId;
    if (!owner) return NextResponse.json({ received: true });
    if(database().prepare("SELECT id FROM privacy_requests WHERE family=?").get(owner))return NextResponse.json({received:true});
    const plan = inferPlanFromSubscription(sub);
    if (!plan)
      return NextResponse.json(
        { error: "Unrecognized price" },
        { status: 400 },
      );
    atomic(() => {
      if (
        database()
          .prepare("SELECT id FROM webhook_events WHERE id=?")
          .get(event.id)
      )
        return;
      const f = family(owner);
      if (
        f.billing?.subscription &&
        f.billing.subscription !== sub.id &&
        !checkout
      )
        return;
      f.billing = {
        status: mapStripeStatus(sub.status),
        customer:
          typeof sub.customer === "string" ? sub.customer : sub.customer.id,
        subscription: sub.id,
        periodEnd: (getSubscriptionPeriodEnd(sub) ?? 0) * 1000,
        plan,
      };
      f.trialUsed = true;
      saveFamily(f);
      database()
        .prepare("INSERT INTO webhook_events VALUES(?,?)")
        .run(event.id, Date.now());
      log(owner, "billing.sync", f.billing.status);
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Could not synchronize subscription" },
      { status: 500 },
    );
  }
}

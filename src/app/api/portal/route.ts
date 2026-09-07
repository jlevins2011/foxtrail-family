import { NextResponse } from "next/server";
import { requireParent, sameOrigin } from "@/lib/platform/security";
import { family, Problem } from "@/lib/platform/model";
import { getStripe } from "@/lib/stripe";
import { getAppUrl, isStripeConfigured } from "@/lib/env";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const v = await requireParent();
    if (v.isDevPreview || !isStripeConfigured())
      throw new Problem("Billing is not connected in local testing.", 503);
    const f = family(v.userId);
    if (!f.billing?.customer)
      throw new Problem("There is no paid membership to manage yet.");
    const s = await getStripe().billingPortal.sessions.create({
      customer: f.billing.customer,
      return_url: getAppUrl() + "/dashboard/membership",
    });
    return NextResponse.json({ url: s.url });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Problem
            ? e.message
            : "Billing is temporarily unavailable.",
      },
      { status: e instanceof Problem ? e.status : 500 },
    );
  }
}

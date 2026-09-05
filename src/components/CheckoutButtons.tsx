"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { plans, type PlanId } from "@/config/pricing";
import { Button } from "@/components/ui";

export function CheckoutButtons({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(plan: PlanId) {
    if (!signedIn) {
      router.push("/sign-in?redirect_url=/unlock");
      return;
    }

    setBusy(plan);
    setError(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start checkout.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-3xl border border-pine/10 bg-snow p-6"
          >
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-mist">
              {plan.label}
            </p>
            <p className="mt-2 font-display text-4xl text-pine">
              {plan.priceLabel}
            </p>
            <p className="text-sm text-mist">{plan.cadence}</p>
            {plan.highlight ? (
              <p className="mt-2 text-sm font-semibold text-ember">
                {plan.highlight}
              </p>
            ) : null}
            <Button
              className="mt-6 w-full"
              variant={plan.id === "yearly" ? "lantern" : "primary"}
              disabled={busy !== null}
              onClick={() => start(plan.id)}
            >
              {busy === plan.id
                ? "Opening Stripe…"
                : `Start 14-day trial · ${plan.label.toLowerCase()}`}
            </Button>
          </div>
        ))}
      </div>
      {error ? (
        <p className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember" role="alert">
          {error}
        </p>
      ) : null}
      {!signedIn ? (
        <p className="text-sm leading-6 text-mist">
          A parent email comes first. We will send you to sign-in, then Stripe
          Checkout with a 14-day trial. The library is not free after that
          unless you keep the family key.
        </p>
      ) : null}
    </div>
  );
}

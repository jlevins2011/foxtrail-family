import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalButton } from "@/components/PortalButton";
import { ButtonLink, Section } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isClerkConfigured, isDevUnlockEnabled } from "@/lib/env";
import {
  getFamilyBilling,
  isFamilyUnlocked,
  statusLabel,
} from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Parent dashboard",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const viewer = await getViewer();

  if (!viewer) {
    if (!isClerkConfigured() && !isDevUnlockEnabled()) {
      return (
        <Section className="max-w-3xl">
          <h1 className="font-display text-4xl text-pine">Parent dashboard</h1>
          <p className="mt-4 text-lg leading-8 text-bark/80">
            This page shows subscription status and a Stripe billing portal
            link after Clerk magic-link auth is configured.
          </p>
          <div className="mt-6">
            <ButtonLink href="/sign-in">Set up parent sign-in</ButtonLink>
          </div>
        </Section>
      );
    }
    redirect("/sign-in?redirect_url=/dashboard");
  }

  const billing = await getFamilyBilling(viewer.userId);
  const unlocked = isFamilyUnlocked(billing);
  const period = billing.currentPeriodEnd
    ? new Date(billing.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Section className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        Grown-ups only
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine">Family dashboard</h1>
      <p className="mt-4 text-lg leading-8 text-bark/80">
        Parent email is the family key. Kids do not get accounts on this hub.
      </p>

      <dl className="mt-8 grid gap-4 rounded-3xl border border-pine/10 bg-snow p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-mist">
            Parent email
          </dt>
          <dd className="mt-1 text-lg text-pine">{viewer.email ?? "Signed in"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-mist">
            Subscription
          </dt>
          <dd className="mt-1 text-lg text-pine">{statusLabel(billing.status)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-mist">
            Plan
          </dt>
          <dd className="mt-1 text-lg capitalize text-pine">
            {billing.plan ?? "None yet"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.14em] text-mist">
            Current period
          </dt>
          <dd className="mt-1 text-lg text-pine">{period ?? "—"}</dd>
        </div>
      </dl>

      {billing.source === "dev" ? (
        <p className="mt-4 rounded-2xl bg-lantern/15 px-4 py-3 text-sm text-bark">
          Dev unlock is on. This is a local preview, not a Stripe customer.
        </p>
      ) : null}

      {billing.status === "past_due" ? (
        <p className="mt-4 rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
          Payment is past due. The library stays open for a grace period — please
          update the card in the Stripe portal.
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-4">
        {unlocked ? (
          <ButtonLink href="/library">Open the family library</ButtonLink>
        ) : (
          <ButtonLink href="/unlock" variant="lantern">
            Unlock all games
          </ButtonLink>
        )}
        <PortalButton enabled={Boolean(billing.stripeCustomerId)} />
      </div>
    </Section>
  );
}

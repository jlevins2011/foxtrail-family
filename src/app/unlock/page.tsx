import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { familySku, monetizationCopy } from "@/config/pricing";
import { CheckoutButtons } from "@/components/CheckoutButtons";
import { ButtonLink, Section } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { pageMetadata } from "@/lib/seo";
import { getFamilyBilling, isFamilyUnlocked } from "@/lib/subscription";

export const metadata: Metadata = pageMetadata({
  title: "Start a 14-day family trial",
  description:
    "Free demos always. Start a 14-day Foxtrail Family trial, then $9.99/month or $79/year. Parent email only — no Apple IAP.",
  path: "/unlock",
});

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const viewer = await getViewer();
  const billing = viewer ? await getFamilyBilling(viewer.userId) : null;
  const unlocked = billing ? isFamilyUnlocked(billing) : false;

  return (
    <Section className="max-w-4xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">
        Family subscription
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine sm:text-5xl">
        {monetizationCopy.trialHeadline}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-bark/80">
        {monetizationCopy.trialBody} A parent email is the only account on{" "}
        {brand.name} in v1 — no child logins, no Apple IAP. After{" "}
        {familySku.trialDays} days, the library stays open only while the family
        key is active.
      </p>

      {unlocked ? (
        <div className="mt-8 rounded-3xl border border-moss/30 bg-moss/10 p-6">
          <p className="font-display text-2xl text-pine">This family is unlocked.</p>
          <p className="mt-2 text-bark/80">
            The library and Add to Home Screen steps are ready.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/library">Open the library</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Parent dashboard
            </ButtonLink>
          </div>
        </div>
      ) : (
        <div className="mt-8">
          <CheckoutButtons signedIn={Boolean(viewer)} />
        </div>
      )}

      <aside className="mt-10 rounded-3xl bg-parchment/70 p-6 text-sm leading-6 text-bark/80">
        <p className="font-semibold text-pine">What checkout does</p>
        <p className="mt-2">
          Stripe Checkout starts a {familySku.trialDays}-day trial, then the
          monthly or yearly family SKU. A webhook marks this parent as
          trialing or subscribed. Demos stay free. The games still live on
          GitHub Pages.
        </p>
      </aside>
    </Section>
  );
}

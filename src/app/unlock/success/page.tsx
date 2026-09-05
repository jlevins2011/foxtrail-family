import type { Metadata } from "next";
import { ButtonLink, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Welcome to the trail",
};

export default function UnlockSuccessPage() {
  return (
    <Section className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">
        Checkout complete
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine">
        The lantern is lit.
      </h1>
      <p className="mt-4 text-lg leading-8 text-bark/80">
        Your 14-day full-family trial starts when the Stripe webhook lands —
        usually a few seconds. After the trial, the library stays open only
        while the monthly or yearly family key is active. Demos remain free.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/library">Go to the library</ButtonLink>
        <ButtonLink href="/install" variant="secondary">
          Add to Home Screen
        </ButtonLink>
      </div>
    </Section>
  );
}

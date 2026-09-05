import type { Metadata } from "next";
import { ButtonLink, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Checkout canceled",
};

export default function UnlockCanceledPage() {
  return (
    <Section className="max-w-3xl">
      <h1 className="font-display text-4xl text-pine">Checkout paused</h1>
      <p className="mt-4 text-lg leading-8 text-bark/80">
        Nothing was charged. You can try a demo anytime, or come back when the
        family is ready to unlock.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/unlock">Return to plans</ButtonLink>
        <ButtonLink href="/#games" variant="secondary">
          Play a demo
        </ButtonLink>
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <Section className="max-w-3xl">
      <h1 className="font-display text-4xl text-pine">Privacy</h1>
      <p className="mt-4 text-lg leading-8 text-bark/80">
        {brand.name} is built for families, with a COPPA-aware v1: the hub
        collects a parent email only. We do not run ads or chat, and we do not
        invent extra analytics on this site.
      </p>
      <div className="mt-8 space-y-6 text-base leading-7 text-bark/85">
        <section>
          <h2 className="font-display text-2xl text-pine">What we collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>A parent email address, via Clerk magic-link authentication.</li>
            <li>
              Subscription status and Stripe customer identifiers so we know
              this family is unlocked.
            </li>
            <li>Payment details stay with Stripe. We never see full card numbers.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-pine">What we do not collect</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Child emails, child names, or child accounts on this hub.</li>
            <li>Chat messages — there is no chat.</li>
            <li>Advertising identifiers. There are no ads.</li>
            <li>Homegrown analytics dashboards or invented usage charts.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-2xl text-pine">The games</h2>
          <p className="mt-2">
            Camp Compass, Keytrail, and Lumen Isles open on GitHub Pages. Those
            games may have their own parent PIN reports. This hub does not copy
            their player data. Harder demo vs full gates belong in those repos.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-pine">Contact</h2>
          <p className="mt-2">
            {brand.supportEmail
              ? `Parents can reach us at ${brand.supportEmail}.`
              : "Set NEXT_PUBLIC_SUPPORT_EMAIL or brand.supportEmail when you are ready to publish a contact address."}
          </p>
        </section>
      </div>
    </Section>
  );
}

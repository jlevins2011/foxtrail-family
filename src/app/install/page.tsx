import type { Metadata } from "next";
import { InstallGuide } from "@/components/InstallGuide";
import { ButtonLink, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Add Foxtrail to an iPad Home Screen",
  description:
    "Add Foxtrail Family to an iPad Home Screen in Safari. Free demos stay available; the full library needs a 14-day trial or family key.",
  path: "/install",
});

export default function InstallPage() {
  return (
    <Section>
      <InstallGuide asPageTitle />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/library">Family library</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to the hub
        </ButtonLink>
      </div>
    </Section>
  );
}

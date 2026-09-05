import type { Metadata } from "next";
import { InstallGuide } from "@/components/InstallGuide";
import { ButtonLink, Section } from "@/components/ui";

export const metadata: Metadata = {
  title: "Add to Home Screen",
};

export default function InstallPage() {
  return (
    <Section>
      <InstallGuide />
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/library">Family library</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Back to the hub
        </ButtonLink>
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { clerkAppearance } from "@/config/brand";
import { Section } from "@/components/ui";
import { isClerkConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Create a parent login",
};

export default function SignUpPage() {
  return (
    <Section className="max-w-xl">
      <h1 className="font-display text-4xl text-pine">Create a parent login</h1>
      <p className="mt-4 text-base leading-7 text-bark/80">
        Same as sign-in: a grown-up email and a magic link. This is not a kid
        profile.
      </p>
      <div className="mt-8">
        {isClerkConfigured() ? (
          <SignUp
            appearance={clerkAppearance}
            fallbackRedirectUrl="/unlock"
            forceRedirectUrl="/unlock"
          />
        ) : (
          <p className="rounded-3xl bg-parchment/80 p-5 text-sm leading-7">
            Configure Clerk first — see the sign-in page and the README.
          </p>
        )}
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { brand, clerkAppearance } from "@/config/brand";
import { Section } from "@/components/ui";
import { isClerkConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Parent sign in",
};

export default function SignInPage() {
  return (
    <Section className="max-w-xl">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        Grown-up email
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine">
        Sign in with a magic link
      </h1>
      <p className="mt-4 text-base leading-7 text-bark/80">
        {brand.name} uses a parent email only. We will send a sign-in link — no
        password for kids to find, and no child email on this hub.
      </p>

      <div className="mt-8">
        {isClerkConfigured() ? (
          <SignIn
            appearance={clerkAppearance}
            fallbackRedirectUrl="/library"
            forceRedirectUrl="/library"
          />
        ) : (
          <div className="rounded-3xl border border-pine/10 bg-snow p-6 text-sm leading-7 text-bark/80">
            <p className="font-semibold text-pine">Clerk is not configured yet.</p>
            <p className="mt-2">
              Add <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{" "}
              <code>CLERK_SECRET_KEY</code>, then in the Clerk Dashboard enable
              Email as the identifier and Email verification link as the factor.
              Disable passwords if you want magic-link only.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

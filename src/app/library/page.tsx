import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { games } from "@/config/games";
import { GameCard } from "@/components/GameCard";
import { InstallGuide } from "@/components/InstallGuide";
import { UnlockCTA } from "@/components/UnlockCTA";
import { ButtonLink, Section } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { isClerkConfigured, isDevUnlockEnabled } from "@/lib/env";
import { getFamilyBilling, isFamilyUnlocked } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Family library",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const viewer = await getViewer();

  if (!viewer) {
    if (!isClerkConfigured() && !isDevUnlockEnabled()) {
      return (
        <Section className="max-w-3xl">
          <h1 className="font-display text-4xl text-pine">Family library</h1>
          <p className="mt-4 text-lg leading-8 text-bark/80">
            After a parent starts the 14-day trial or subscribes, this page
            holds the full library links plus Add to Home Screen steps. Demos
            on the public game pages stay free.
          </p>
          <div className="mt-8">
            <UnlockCTA compact />
          </div>
        </Section>
      );
    }
    redirect("/sign-in?redirect_url=/library");
  }

  const billing = await getFamilyBilling(viewer.userId);
  const unlocked = isFamilyUnlocked(billing);

  if (!unlocked) {
    return (
      <Section className="max-w-3xl">
        <h1 className="font-display text-4xl text-pine">Almost on the trail</h1>
        <p className="mt-4 text-lg leading-8 text-bark/80">
          Signed in as {viewer.email ?? "a parent"}. Start the 14-day trial
          (then $9.99/month or $79/year) to open the full library. Demos stay
          free without a key.
        </p>
        <div className="mt-8">
          <UnlockCTA compact />
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember">
        Unlocked for this family
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine sm:text-5xl">
        Your camp library
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-bark/80">
        Trial or subscription is active. Public demos remain free for anyone;
        this library is the family key view. When each game adds a hard gate,
        these are the full-play links.
      </p>
      <div className="mt-4">
        <ButtonLink href="/dashboard" variant="secondary">
          Parent dashboard
        </ButtonLink>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {games.map((game) => (
          <GameCard key={game.id} game={game} mode="library" />
        ))}
      </div>
      <div className="mt-12">
        <InstallGuide />
      </div>
    </Section>
  );
}

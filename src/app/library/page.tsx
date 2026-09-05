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
            After a parent signs in and unlocks the family, this page holds the
            full library links plus Add to Home Screen steps.
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
          Signed in as {viewer.email ?? "a parent"}. Unlock the family
          subscription to open the full library view.
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
        These are the same live games as the public demos today. When each game
        repo adds a hard gate, this page is where the family play links stay.
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

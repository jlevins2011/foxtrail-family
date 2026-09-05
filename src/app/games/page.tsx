import type { Metadata } from "next";
import Link from "next/link";
import { games, hubPathForGame } from "@/config/games";
import { monetizationCopy } from "@/config/pricing";
import { GameCard } from "@/components/GameCard";
import { Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Games — Camp Compass, Keytrail, Lumen Isles",
  description:
    "Three Foxtrail Family games with free demos: Camp Compass (US geography), Keytrail (typing), and Lumen Isles (3D island adventure).",
  path: "/games",
});

export default function GamesIndexPage() {
  return (
    <Section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
        The camp
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine sm:text-5xl">
        Three games. Free demos.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-bark/80">
        Each page below is a hub landing with real copy for search engines. Play
        demo opens the live GitHub Pages game — we do not host the engines here.
        {` ${monetizationCopy.trialBody}`}
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {games.map((game) => (
          <div key={game.id} className="flex flex-col gap-3">
            <GameCard game={game} mode="demo" />
            <Link
              href={hubPathForGame(game)}
              className="text-center text-sm font-semibold text-pine underline-offset-4 hover:underline"
            >
              Open the {game.name} page
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}

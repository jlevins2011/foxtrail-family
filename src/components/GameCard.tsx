import Link from "next/link";
import type { Game } from "@/config/games";
import { hubPathForGame } from "@/config/games";
import { ButtonLink } from "@/components/ui";

const accentBar: Record<Game["accent"], string> = {
  moss: "bg-moss",
  lantern: "bg-lantern",
  dusk: "bg-dusk",
};

export function GameCard({
  game,
  mode,
}: {
  game: Game;
  mode: "demo" | "library";
}) {
  const href = game.playUrl;
  const label = mode === "library" ? "Play" : "Play demo";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-pine/10 bg-snow/90 shadow-[0_12px_40px_rgba(42,33,24,0.06)]">
      <div className={`h-2 ${accentBar[game.accent]}`} />
      <div className="flex flex-1 flex-col gap-4 p-6 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
          {game.subject}
        </p>
        <div>
          <h3 className="font-display text-2xl text-pine">
            <Link href={hubPathForGame(game)} className="hover:underline">
              {game.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ember">With {game.mascot}</p>
        </div>
        <p className="text-base leading-7 text-bark/85">{game.blurb}</p>
        <p className="text-sm leading-6 text-mist">{game.summary}</p>
        <div className="mt-auto flex flex-col gap-3 pt-2">
          <ButtonLink href={href} variant="primary" external>
            {label}
          </ButtonLink>
          {mode === "demo" ? (
            <ButtonLink href={hubPathForGame(game)} variant="secondary">
              About {game.shortName}
            </ButtonLink>
          ) : null}
          <p className="text-xs leading-5 text-mist">{game.demoNote}</p>
        </div>
      </div>
    </article>
  );
}

import { brand } from "@/config/brand";
import { games } from "@/config/games";
import { ForestBackdrop } from "@/components/ForestBackdrop";
import { GameCard } from "@/components/GameCard";
import { PipMark } from "@/components/PipMark";
import { UnlockCTA } from "@/components/UnlockCTA";
import { ButtonLink, Section } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="relative">
      <ForestBackdrop />
      <Section className="pb-6 pt-10 sm:pt-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm font-semibold text-pine ring-1 ring-pine/10">
            <PipMark size={22} />
            {brand.mascots.primary.name} the {brand.mascots.primary.role}
          </div>
          <h1 className="font-display text-4xl leading-tight text-pine sm:text-6xl">
            Light the trail together.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-bark/80 sm:text-xl">
            {brand.pitch}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="#games" variant="primary">
              See the three games
            </ButtonLink>
            <ButtonLink href="/unlock" variant="lantern">
              Unlock all games
            </ButtonLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-pine">
            {["No ads", "No chat", "Parent email only", "Privacy-first"].map(
              (item) => (
                <li
                  key={item}
                  className="rounded-full bg-white/75 px-3 py-1.5 ring-1 ring-pine/10"
                >
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </Section>

      <Section id="games" className="pt-4">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-mist">
            The camp
          </p>
          <h2 className="mt-2 font-display text-3xl text-pine sm:text-4xl">
            Three games. One family hub.
          </h2>
          <p className="mt-3 text-base leading-7 text-bark/80">
            Try a demo from here. Each card opens the live GitHub Pages game —
            we do not copy those codebases into this repo. Hard demo gates can
            be added later inside each game.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} mode="demo" />
          ))}
        </div>
      </Section>

      <Section>
        <UnlockCTA />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Play a demo",
              body: "Open Camp Compass, Keytrail, or Lumen Isles from the cards above. No account needed to look around.",
            },
            {
              step: "2",
              title: "Parent unlocks the family",
              body: "A grown-up signs in with email, then chooses monthly or yearly. Stripe Checkout holds the card — not us.",
            },
            {
              step: "3",
              title: "Park it on the iPad",
              body: "After unlock, the library and Add to Home Screen steps live together so camp is one icon away.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-pine/10 bg-white/70 p-6"
            >
              <p className="text-sm font-bold text-ember">Step {item.step}</p>
              <h3 className="mt-2 font-display text-2xl text-pine">
                {item.title}
              </h3>
              <p className="mt-2 text-base leading-7 text-bark/80">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

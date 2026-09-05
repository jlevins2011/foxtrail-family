import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGameBySlug, hubPathForGame } from "@/config/games";
import { brand } from "@/config/brand";
import { familySku, monetizationCopy } from "@/config/pricing";
import { ButtonLink, Section } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return games.map((game) => ({ slug: game.slug }));
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) {
    return { title: "Game not found" };
  }
  return pageMetadata({
    title: game.seoTitle,
    description: game.seoDescription,
    path: hubPathForGame(game),
  });
}

export default async function GameLandingPage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: game.seoTitle,
    description: game.seoDescription,
    isPartOf: {
      "@type": "WebSite",
      name: brand.name,
    },
    about: {
      "@type": "SoftwareApplication",
      name: game.name,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
    },
  };

  return (
    <Section className="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="text-sm font-semibold text-mist">
        <Link href="/" className="hover:text-pine">
          Home
        </Link>
        {" / "}
        <Link href="/games" className="hover:text-pine">
          Games
        </Link>
        {" / "}
        <span className="text-pine">{game.name}</span>
      </nav>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-mist">
        {game.subject}
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine sm:text-5xl">
        {game.name}
      </h1>
      <p className="mt-2 text-ember">With {game.mascot}</p>
      <p className="mt-5 text-lg leading-8 text-bark/80">{game.landing}</p>
      <p className="mt-4 text-base leading-7 text-bark/80">{game.summary}</p>
      <p className="mt-4 text-base leading-7 text-bark/80">
        {monetizationCopy.demoAlwaysFree} {monetizationCopy.afterTrial} Trial
        length: {familySku.trialDays} days.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={game.playUrl} variant="primary" external>
          Play demo
        </ButtonLink>
        <ButtonLink href="/unlock" variant="lantern">
          Start the 14-day family trial
        </ButtonLink>
      </div>
      <p className="mt-4 text-sm leading-6 text-mist">{game.demoNote}</p>
      <section className="mt-12">
        <h2 className="font-display text-2xl text-pine">Also on the trail</h2>
        <ul className="mt-4 space-y-2 text-base">
          {games
            .filter((item) => item.id !== game.id)
            .map((item) => (
              <li key={item.id}>
                <Link className="font-semibold text-pine hover:underline" href={hubPathForGame(item)}>
                  {item.name}
                </Link>
                <span className="text-mist"> — {item.subject}</span>
              </li>
            ))}
        </ul>
      </section>
    </Section>
  );
}

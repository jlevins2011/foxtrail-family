import Link from "next/link";
import { notFound } from "next/navigation";
import { games, getGameBySlug } from "@/config/games";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
export function generateStaticParams() {
  return games.map((g) => ({ slug: g.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = getGameBySlug((await params).slug);
  if (!g) return {};
  return pageMetadata({
    title: g.seoTitle,
    description: g.seoDescription,
    path: "/games/" + g.slug,
  });
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const g = getGameBySlug((await params).slug);
  if (!g) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: g.name,
    description: g.blurb,
    learningResourceType: "Educational game",
    educationalLevel: "Kindergarten through grade 5",
    url: absoluteUrl("/games/" + g.slug),
    inLanguage: "en",
    isAccessibleForFree: false,
  };
  return (
    <div className="workspace" style={{ maxWidth: 900 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
      <Link className="text-link" href="/games">
        ← All games
      </Link>
      <p className="eyebrow" style={{ marginTop: 32 }}>
        {g.subject} · K–5
      </p>
      <h1>{g.name}</h1>
      <p style={{ fontSize: 22 }}>{g.blurb}</p>
      <section className="panel" style={{ marginTop: 32 }}>
        <h2>A place in your family’s learning day.</h2>
        <p>{g.summary}</p>
        <p style={{ marginTop: 16 }}>
          Choose a learner in your family library to continue their adventure.
          Parent-assigned questions use subjects supported by this game.
        </p>
        <div className="actions">
          <Link className="action" href="/library">
            Play with your family →
          </Link>
          <Link className="text-link" href="/unlock">
            See membership options
          </Link>
        </div>
      </section>
    </div>
  );
}

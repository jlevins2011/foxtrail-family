import Link from "next/link";
import { games } from "@/config/games";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({
  title: "Math, typing, geography, and island adventures for K–5",
  description:
    "Meet Sumtrail, Keytrail, Camp Compass, and Lumen Isles. Four games connected by one family learning profile.",
  path: "/games",
});
export default function Page() {
  return (
    <div className="home-shell">
      <p className="eyebrow">Choose a trail</p>
      <h1 style={{ font: "48px Georgia", margin: "18px 0 32px" }}>
        Learning has a world to explore.
      </h1>
      <div className="game-grid">
        {games.map((g, i) => (
          <Link
            key={g.id}
            className={"trail-card trail-" + i}
            href={"/games/" + g.slug}
          >
            <span className="game-number">{g.subject}</span>
            <h3>{g.name}</h3>
            <p>{g.blurb}</p>
            <span className="trail-link">Explore {g.shortName} ↗</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

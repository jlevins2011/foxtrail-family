import Link from "next/link";
import { games } from "@/config/games";
import Image from "next/image";
export default function HomePage() {
  return (
    <div className="home-shell">
      <section className="welcome">
        <div>
          <p className="eyebrow">A little practice. A bigger adventure.</p>
          <h1>
            A whole world of
            <br />
            “I did it!”
          </h1>
          <p>
            Math, maps, typing, and islands to make their own. One home for your
            K–5 learners, with you in control.
          </p>
          <div className="actions">
            <Link className="action" href="/library">
              Enter your family’s world <span>↗</span>
            </Link>
            <Link className="text-link" href="/unlock">
              Explore membership →
            </Link>
          </div>
          <p className="fine">
            One membership · Up to six children · 14 days to explore
          </p>
        </div>
        <Image width={600} height={435} priority
          src="/art/camp-dusk.webp"
          alt="A lantern-lit woodland camp at dusk"
        />
      </section>
      <section className="game-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pick a trail</p>
            <h2>Four ways to find their spark.</h2>
          </div>
          <span>Built for curious minds, K–5</span>
        </div>
        <div className="game-grid">
          {games.map((g, i) => (
            <Link
              className={"trail-card trail-" + i}
              href={"/games/" + g.slug}
              key={g.id}
            >
              <span className="game-number">
                0{i + 1} / {g.subject}
              </span>
              <h3>{g.name}</h3>
              <p>{g.blurb}</p>
              <span className="trail-link">Explore this game ↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="family-note">
        <h2>
          Their adventures.
          <br />
          Your guidance.
        </h2>
        <div>
          <p>
            Set each child’s grade and learning plan once. Use your own question
            banks, choose a different plan for any game, and see how their
            practice is growing.
          </p>
          <p>
            Learning unlocks special treasures in Lumen Isles. Earned playtime
            is always your choice.
          </p>
          <Link href="/dashboard" className="text-link">
            Open parent space →
          </Link>
        </div>
      </section>
    </div>
  );
}

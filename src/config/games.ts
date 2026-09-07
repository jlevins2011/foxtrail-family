export type GameId = "camp-compass" | "keytrail" | "lumen-isles" | "sumtrail";

export type Game = {
  id: GameId;
  slug: string;
  name: string;
  shortName: string;
  subject: string;
  blurb: string;
  summary: string;
  landing: string;
  seoTitle: string;
  seoDescription: string;
  playUrl: string;
  repoUrl: string;
  accent: "moss" | "lantern" | "dusk";
  mascot: string;
  demoNote: string;
};

export const games: Game[] = [
  {
    id: "sumtrail",
    slug: "sumtrail",
    name: "Sumtrail",
    shortName: "Sumtrail",
    subject: "Math",
    blurb:
      "Build number sense with hands-on workshops, lantern trails, and gentle guided practice.",
    summary:
      "Explore addition, subtraction, multiplication, and division at a pace that fits your child.",
    landing:
      "Hands-on math for kindergarten through fifth grade. Walk a trail, build a model, and discover how numbers work together.",
    seoTitle: "Sumtrail — hands-on math games for K–5",
    seoDescription:
      "Practice addition, subtraction, multiplication, and division through interactive math workshops and woodland trails.",
    playUrl: "https://jlevins2011.github.io/sumtrail/",
    repoUrl: "https://github.com/jlevins2011/sumtrail",
    accent: "lantern",
    mascot: "Pip",
    demoNote: "Try the first camp free.",
  },
  {
    id: "camp-compass",
    slug: "camp-compass",
    name: "Camp Compass",
    shortName: "Compass",
    subject: "US geography",
    blurb:
      "Travel five regional camps, tap states on a real map, match capitals, and collect story stones with Pip the lantern fox.",
    summary:
      "A map-and-capital trail across the Northeast, Southeast, Midwest, Southwest, and West. Wrong answers teach the fact. PIN-protected parent reports.",
    landing:
      "Camp Compass is a US geography trail for families. Kids move through five camps, tap real states, match capitals, and collect story stones. The demo is always free from this hub. A parent 14-day trial unlocks the full family library.",
    seoTitle: "Camp Compass — US geography game for families",
    seoDescription:
      "Play the free Camp Compass demo: five US camps, state maps, and capitals with Pip the lantern fox. Then start a 14-day Foxtrail Family trial.",
    playUrl: "https://jlevins2011.github.io/state-capitals/",
    repoUrl: "https://github.com/jlevins2011/state-capitals",
    accent: "moss",
    mascot: "Pip",
    demoNote: "Try a first-camp adventure free.",
  },
  {
    id: "keytrail",
    slug: "keytrail",
    name: "Keytrail",
    shortName: "Keytrail",
    subject: "Typing",
    blurb:
      "Home-row first. Every lesson is a trail Pip runs toward camp — later paths add jumps, glow, and the gloom.",
    summary:
      "A typing trail that starts with hand position and grows into camp-night runs. Words per minute plus PIN-protected parent reports.",
    landing:
      "Keytrail teaches typing as a camp trail. Lessons start on the home row. Later paths add jumps, glow, and the gloom. The demo is always free from this hub. After a parent trial or subscription, Keytrail stays in the shared family library.",
    seoTitle: "Keytrail — typing trail for kids and families",
    seoDescription:
      "Play the free Keytrail demo: home-row typing with Pip running toward camp. Unlock the full Foxtrail Family library after a 14-day trial.",
    playUrl: "https://jlevins2011.github.io/typing-game/",
    repoUrl: "https://github.com/jlevins2011/typing-game",
    accent: "lantern",
    mascot: "Pip",
    demoNote: "Try a first-camp adventure free.",
  },
  {
    id: "lumen-isles",
    slug: "lumen-isles",
    name: "Lumen Isles",
    shortName: "Lumen",
    subject: "3D island adventure",
    blurb:
      "Explore, build, and shine. Learning happens in play on a glowing island — Lumen is Pip’s sibling on this trail.",
    summary:
      "A 3D island adventure where curiosity leads. Built for learning-in-play, not a worksheet overlay.",
    landing:
      "Lumen Isles is a 3D island adventure for learning-in-play. Kids explore, build, and shine with Lumen, Pip’s sibling. The demo is always free from this hub. The full family library — including later island unlocks when those land in the game — sits behind the 14-day trial and family key.",
    seoTitle: "Lumen Isles — 3D island adventure for families",
    seoDescription:
      "Play the free Lumen Isles demo: explore, build, and shine on a 3D learning island. Start a 14-day Foxtrail Family trial for the full library.",
    playUrl: "https://jlevins2011.github.io/HS-Game-v1/",
    repoUrl: "https://github.com/jlevins2011/HS-Game-v1",
    accent: "dusk",
    mascot: "Lumen",
    demoNote: "Try a first-camp adventure free.",
  },
];

export function getGameBySlug(slug: string) {
  return games.find((item) => item.slug === slug);
}

export function hubPathForGame(game: Game) {
  return `/games/${game.slug}`;
}

export function getGame(id: GameId) {
  const game = games.find((item) => item.id === id);
  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }
  return game;
}

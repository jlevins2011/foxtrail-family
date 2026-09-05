export type GameId = "camp-compass" | "keytrail" | "lumen-isles";

export type Game = {
  id: GameId;
  name: string;
  shortName: string;
  subject: string;
  blurb: string;
  summary: string;
  playUrl: string;
  repoUrl: string;
  accent: "moss" | "lantern" | "dusk";
  mascot: string;
  demoNote: string;
};

/**
 * Hub catalog only. Do not copy game source into this repo — link out to live Pages.
 * Do not add Spencer-Game / Homeschool-Game-v1 (CraftWorlds) here.
 */
export const games: Game[] = [
  {
    id: "camp-compass",
    name: "Camp Compass",
    shortName: "Compass",
    subject: "US geography",
    blurb:
      "Travel five regional camps, tap states on a real map, match capitals, and collect story stones with Pip the lantern fox.",
    summary:
      "A map-and-capital trail across the Northeast, Southeast, Midwest, Southwest, and West. Wrong answers teach the fact. PIN-protected parent reports.",
    playUrl: "https://jlevins2011.github.io/state-capitals/",
    repoUrl: "https://github.com/jlevins2011/state-capitals",
    accent: "moss",
    mascot: "Pip",
    demoNote:
      "Opens the live game. A hard demo limit (one camp, for example) can be wired later in the Camp Compass repo.",
  },
  {
    id: "keytrail",
    name: "Keytrail",
    shortName: "Keytrail",
    subject: "Typing",
    blurb:
      "Home-row first. Every lesson is a trail Pip runs toward camp — later paths add jumps, glow, and the gloom.",
    summary:
      "A typing trail that starts with hand position and grows into camp-night runs. Words per minute plus PIN-protected parent reports.",
    playUrl: "https://jlevins2011.github.io/typing-game/",
    repoUrl: "https://github.com/jlevins2011/typing-game",
    accent: "lantern",
    mascot: "Pip",
    demoNote:
      "Opens the live game. A hard demo limit (first lessons only) can be wired later in the Keytrail repo.",
  },
  {
    id: "lumen-isles",
    name: "Lumen Isles",
    shortName: "Lumen",
    subject: "3D island adventure",
    blurb:
      "Explore, build, and shine. Learning happens in play on a glowing island — Lumen is Pip’s sibling on this trail.",
    summary:
      "A 3D island adventure where curiosity leads. Built for learning-in-play, not a worksheet overlay.",
    playUrl: "https://jlevins2011.github.io/HS-Game-v1/",
    repoUrl: "https://github.com/jlevins2011/HS-Game-v1",
    accent: "dusk",
    mascot: "Lumen",
    demoNote:
      "Opens the live game. A hard demo island or tool lock can be wired later in the Lumen Isles repo.",
  },
];

export function getGame(id: GameId) {
  const game = games.find((item) => item.id === id);
  if (!game) {
    throw new Error(`Unknown game: ${id}`);
  }
  return game;
}

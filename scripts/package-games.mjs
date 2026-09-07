import {
  cpSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { execFileSync } from "node:child_process";
const root = process.cwd(),
  base = resolve(process.env.FOXTRAIL_GAMES_ROOT || "..");
const games = [
  ["sumtrail", "sumtrail"],
  ["keytrail", "typing-game"],
  ["camp-compass", "state-capitals"],
  ["lumen-isles", "HS-Game-v1"],
];
const releases = [];
function patch(path, from, to) {
  const s = readFileSync(path, "utf8");
  if (!s.includes(from))
    throw Error("Integration point changed: " + path + " / " + from);
  writeFileSync(path, s.replace(from, to));
}
for (const [id, repo] of games) {
  const source = join(base, repo);
  if (!existsSync(source)) throw Error("Missing checkout: " + source);
  const dirty = execFileSync("git", ["status", "--porcelain"], {
    cwd: source,
    encoding: "utf8",
  });
  if (dirty.trim())
    throw Error("Commit or stash changes before packaging " + repo);
  const commit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: source,
    encoding: "utf8",
  }).trim();
  const dest = join(root, "game-dist", id);
  mkdirSync(dest, { recursive: true });
  if (id === "lumen-isles") {
    for (const file of ["index.html", "js", "css", "vendor"])
      cpSync(join(source, file), join(dest, file), { recursive: true });
    patch(
      join(dest, "js/ui.js"),
      "function showNewExplorer() {",
      "function showNewExplorer() { if(window.FamilyHost){FamilyHost.parent();return;}",
    );
    patch(
      join(dest, "js/ui.js"),
      "p.name.toUpperCase()",
      "safeText(p.name.toUpperCase())",
    );
    const ui = join(dest, "js/ui.js");
    writeFileSync(
      ui,
      readFileSync(ui, "utf8").replaceAll(
        "+ Store.profile.name +",
        "+ safeText(Store.profile.name) +",
      ),
    );
    patch(
      join(dest, "js/parent.js"),
      "function show() {",
      "function show() { if(window.FamilyHost){FamilyHost.parent();return;}",
    );
    const build = join(dest, "js/build.js");
    patch(
      build,
      "  var PIECES = [",
      `  var PIECES = [
    {id:'scholarlamp',name:'Scholar’s lantern',icon:'✦',cost:{timber:1},needs:'family-scholar-lantern',desc:'Learning exclusive. Earn 10 discovery credits on your assigned trails.'},
    {id:'tideglasslamp',name:'Tideglass lamp',icon:'✦',cost:{timber:1},needs:'family-tideglass-lamp',desc:'Learning exclusive. Earn 30 discovery credits on your assigned trails.'},
    {id:'starlightlamp',name:'Starlight lamp',icon:'✦',cost:{timber:1},needs:'family-starlight-lamp',desc:'Learning exclusive. Earn 60 discovery credits on your assigned trails.'},`,
    );
    patch(
      build,
      "function buildPieceGeo(g, t, pose) {",
      `function buildPieceGeo(g, t, pose) {
    var familyColor = t==='scholarlamp'?0xffcc66:t==='tideglasslamp'?0x66ddff:t==='starlightlamp'?0xcc88ff:null;
    if(familyColor)t='crystallamp';`,
    );
    patch(
      build,
      't === "moonlamp" ? 0xbadfff : 0x9be4ba',
      'familyColor || (t === "moonlamp" ? 0xbadfff : 0x9be4ba)',
    );
    patch(
      build,
      "function isFurniture(t) {return [",
      'function isFurniture(t) {if(["scholarlamp","tideglasslamp","starlightlamp"].includes(t))return true;return [',
    );
    patch(
      build,
      'p.t === "bench" || p.t === "bed"',
      '/^(scholar|tideglass|starlight)lamp$/.test(p.t) || p.t === "bench" || p.t === "bed"',
    );
    patch(
      build,
      `pose.reason="Wren's lantern kit unlocks this"`,
      `pose.reason=def.needs.indexOf("family-")===0?"Earn discovery credits on your learning trails to unlock this":"Wren's lantern kit unlocks this"`,
    );
  } else {
    const work = join(root, ".game-builds", id);
    mkdirSync(work, { recursive: true });
    for (const file of [
      "src",
      "public",
      "index.html",
      "package.json",
      "tsconfig.json",
      "vite.config.ts",
    ])
      if (existsSync(join(source, file)))
        cpSync(join(source, file), join(work, file), { recursive: true });
    if (!existsSync(join(work, "node_modules")))
      symlinkSync(
        join(source, "node_modules"),
        join(work, "node_modules"),
        "dir",
      );
    const mapName = id === "camp-compass" ? "RegionMap" : "TrailMap";
    patch(
      join(work, "src/App.tsx"),
      "  return (",
      `
 const host = (window as unknown as {FamilyHost?:{practice:()=>void;parent:()=>void;library:()=>void}}).FamilyHost;
 if(host && ['parent','parent-gate','start-level'].includes(view.name))return <div className="screen"><h1>Managed in parent space</h1><button className="btn primary" onClick={host.parent}>Open parent space</button></div>;
 if(host && view.name==='profiles')return <div className="screen"><h1>Choose your family profile</h1><button className="btn primary" onClick={host.library}>Open family library</button></div>;
 return (`,
    );
    patch(
      join(work, "src/App.tsx"),
      `{view.name === "map" && <${mapName} />}`,
      `{host && view.name==='map' && <div style={{padding:'14px 22px',background:'#143747',color:'white',display:'flex',gap:16,alignItems:'center',flexWrap:'wrap'}}><strong>Your assigned learning trail</strong><span>Practice your family’s questions and earn island treasures.</span><button className="btn primary" onClick={host.practice}>Start learning trail →</button></div>}
      {view.name === "map" && <${mapName} />}`,
    );
    if (id === "sumtrail")
      patch(
        join(work, "src/lib/facts.ts"),
        "  const pool = candidatesFor(bank);",
        `  const assigned=(window as unknown as {FamilyHost?:{mathFacts:Fact[]}}).FamilyHost?.mathFacts;
  const pool = assigned?.length ? assigned : candidatesFor(bank);`,
      );
    if (id === "keytrail")
      patch(
        join(work, "src/lib/prompts.ts"),
        '  if (lesson.id === "summit-exam") return EXAM_PASSAGE;',
        `  const assigned=(window as unknown as {FamilyHost?:{assigned:{answer:string}[]}}).FamilyHost?.assigned;
  if(assigned?.length && assigned.every(q=>/^[\\x20-\\x7E]+$/.test(q.answer))){const words=assigned.map(q=>q.answer).join(' ');return Array.from({length:Math.max(1,Math.ceil(lesson.promptChars/(words.length+1)))},()=>words).join(' ').slice(0,Math.max(words.length,lesson.promptChars)).trim();}
  if (lesson.id === "summit-exam") return EXAM_PASSAGE;`,
      );
    if (id === "camp-compass")
      patch(
        join(work, "src/lib/quiz.ts"),
        "  const pool = lesson.stateIds;",
        `  const assigned=(window as unknown as {FamilyHost?:{assigned:{prompt:string;answer:string;explanation:string;choices?:string[]}[]}}).FamilyHost?.assigned;
  if(assigned?.length){const questions=assigned.map(q=>{const state=STATES.find(s=>q.prompt.toLowerCase().includes(s.name.toLowerCase())&&q.answer.toLowerCase()===s.capital.toLowerCase());if(!state)return null;return {kind:'choice' as const,skill:'capital-of' as const,stateId:state.id,prompt:q.prompt,answer:state.capital,fact:q.explanation,choices:shuffle([state.capital,...STATES.filter(s=>s.id!==state.id).slice(0,3).map(s=>s.capital)],rand)};});if(questions.every((q):q is NonNullable<typeof q>=>q!==null))return Array.from({length:lesson.questionCount},(_,i)=>questions[i%questions.length]);}
  const pool = lesson.stateIds;`,
      );
    if (id === "sumtrail") {
      const settings = join(work, "src/components/Settings.tsx");
      const source = readFileSync(settings, "utf8");
      writeFileSync(
        settings,
        source.replace(
          "{child && (",
          "{child && !(window as unknown as {FamilyHost?:unknown}).FamilyHost && (",
        ),
      );
    }
    const store = join(work, "src/store/StoreContext.tsx");
    patch(store, 'view: { name: "title" }', 'view: { name: "map" }');
    execFileSync(
      process.execPath,
      [
        join(source, "node_modules/vite/bin/vite.js"),
        "build",
        "--base",
        `/api/games/${id}/`,
        "--outDir",
        dest,
        "--emptyOutDir",
      ],
      { cwd: work, stdio: "inherit" },
    );
  }
  releases.push({
    id,
    repository: "jlevins2011/" + repo,
    commit,
    packagedAt: new Date().toISOString(),
  });
}
writeFileSync(
  join(root, "game-releases.json"),
  JSON.stringify({ schemaVersion: 1, games: releases }, null, 2) + "\n",
);
console.log("Packaged four pinned game releases.");

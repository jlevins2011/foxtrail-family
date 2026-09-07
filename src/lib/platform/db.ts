import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
let db: DatabaseSync;
export function database() {
  if (db) return db;
  const path = resolve(
    process.env.FOXTRAIL_DATABASE_PATH || "./data/family.sqlite",
  );
  mkdirSync(dirname(path), { recursive: true });
  db = new DatabaseSync(path);
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
 CREATE TABLE IF NOT EXISTS families(id TEXT PRIMARY KEY, data TEXT NOT NULL, updated INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, family TEXT NOT NULL, kind TEXT NOT NULL, child TEXT, expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, reset INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS banks(id TEXT PRIMARY KEY, family TEXT NOT NULL, data TEXT NOT NULL, share TEXT UNIQUE);
 CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY, family TEXT NOT NULL, child TEXT NOT NULL, game TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL, answered INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS rewards(event TEXT PRIMARY KEY, family TEXT NOT NULL, child TEXT NOT NULL, game TEXT NOT NULL, correct INTEGER NOT NULL, created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS game_saves(family TEXT NOT NULL, child TEXT NOT NULL, game TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY(family,child,game));
 CREATE TABLE IF NOT EXISTS native_records(id TEXT PRIMARY KEY,family TEXT NOT NULL,child TEXT NOT NULL,game TEXT NOT NULL,lesson TEXT NOT NULL,data TEXT NOT NULL,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS webhook_events(id TEXT PRIMARY KEY,created INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY, hash TEXT UNIQUE NOT NULL, data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, actor TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL, created INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS sessions_owner ON sessions(family,child,kind,expires);
 CREATE INDEX IF NOT EXISTS rewards_owner ON rewards(family,child,created);
 CREATE INDEX IF NOT EXISTS banks_owner ON banks(family);
 CREATE INDEX IF NOT EXISTS native_owner ON native_records(family,child,game,lesson,created);
 INSERT OR IGNORE INTO schema_version(version) VALUES(1);`);
  const now=Date.now();
  db.prepare("DELETE FROM sessions WHERE expires<?").run(now);
  db.prepare("DELETE FROM limits WHERE reset<?").run(now);
  db.prepare("DELETE FROM challenges WHERE created<?").run(now-86400000);
  return db;
}
export function atomic<T>(fn: () => T): T {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function log(actor: string, action: string, detail: string) {
  database()
    .prepare("INSERT INTO audit(actor,action,detail,created) VALUES(?,?,?,?)")
    .run(actor, action, detail, Date.now());
}

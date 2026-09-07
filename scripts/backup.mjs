import { DatabaseSync, backup } from "node:sqlite";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
const source = process.env.FOXTRAIL_DATABASE_PATH || "./data/family.sqlite";
const destination = process.argv[2];
if (
  !destination ||
  resolve(destination) === resolve(source) ||
  existsSync(destination)
)
  throw new Error(
    "Provide a new backup filename different from the database path.",
  );
const db = new DatabaseSync(source, { readOnly: true });
try {
  await backup(db, destination);
  console.log("Database backup saved.");
} finally {
  db.close();
}

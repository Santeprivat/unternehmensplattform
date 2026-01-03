import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export type DbHandle = {
  db: Database.Database;
  close: () => void;
};

/**
 * Öffnet die WZ-Datenbank (read-only).
 *
 * Priorität:
 * 1. ENV: WZ_DB_PATH
 * 2. Fallback: <repo-root>/classification/dist/wz.db
 */
export function openWzDb(dbPath?: string): DbHandle {
  const envPath = process.env.WZ_DB_PATH;

  const fallbackPath = path.resolve(
    process.cwd(),
    "classification",
    "dist",
    "wz.db"
  );

  const p = dbPath ?? envPath ?? fallbackPath;

  if (!fs.existsSync(p)) {
    throw new Error(
      `WZ-Datenbank nicht gefunden: ${p}\n` +
      `Setze WZ_DB_PATH oder führe 'npm run build:wz-db' im classification-Modul aus.`
    );
  }

  const db = new Database(p, { readonly: true });

  return {
    db,
    close: () => db.close(),
  };
}

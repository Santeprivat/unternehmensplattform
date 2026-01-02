import Database from "better-sqlite3";
import path from "path";

export type DbHandle = {
  db: Database.Database;
  close: () => void;
};

export function openWzDb(dbPath?: string): DbHandle {
  const p = dbPath ?? path.join(process.cwd(), "dist", "wz.db");
  const db = new Database(p, { readonly: true });
  return { db, close: () => db.close() };
}

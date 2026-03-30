import { app } from "electron";
import path from "node:path";
import { createRequire } from "node:module";
import type { HistoryItem, HistoryItemType } from "../../shared/types";

const require = createRequire(import.meta.url);

// Lazy-load better-sqlite3 to avoid issues if native module isn't rebuilt yet
type Database = import("better-sqlite3").Database;

let _db: Database | null = null;

function getDb(): Database {
  if (_db) return _db;
  const BetterSqlite3 =
    require("better-sqlite3") as typeof import("better-sqlite3");
  const dbPath = path.join(app.getPath("userData"), "history.db");

  console.log("[history-store] userData path:", app.getPath("userData"));
  console.log("[history-store] DB path:", dbPath);

  try {
    _db = new BetterSqlite3(dbPath);
    console.log("[history-store] Database opened successfully");
  } catch (e) {
    console.error("[history-store] Failed to open database:", e);
    throw e;
  }

  _db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT    NOT NULL,
      input      TEXT    NOT NULL,
      output     TEXT    NOT NULL,
      output2    TEXT,
      lang_from  TEXT    NOT NULL DEFAULT '',
      lang_to    TEXT    NOT NULL DEFAULT '',
      provider   TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_history_type ON history(type);
    CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at DESC);
  `);
  return _db;
}

export interface AddHistoryParams {
  type: HistoryItemType;
  input: string;
  output: string;
  output2?: string | null;
  langFrom: string;
  langTo: string;
  provider?: string | null;
}

export function addHistory(params: AddHistoryParams, maxItems = 0): void {
  try {
    const db = getDb();
    db.prepare(
      `
      INSERT INTO history (type, input, output, output2, lang_from, lang_to, provider)
      VALUES (@type, @input, @output, @output2, @langFrom, @langTo, @provider)
    `,
    ).run({
      type: params.type,
      input: params.input,
      output: params.output,
      output2: params.output2 ?? null,
      langFrom: params.langFrom,
      langTo: params.langTo,
      provider: params.provider ?? null,
    });

    // Auto-prune: keep only the latest N rows
    if (maxItems > 0) {
      db.prepare(
        `DELETE FROM history WHERE id NOT IN
         (SELECT id FROM history ORDER BY created_at DESC LIMIT ?)`,
      ).run(maxItems);
    }
  } catch (e) {
    console.error("[history] addHistory failed:", e);
  }
}

export function listHistory(
  opts: { limit?: number; type?: HistoryItemType } = {},
): HistoryItem[] {
  try {
    const db = getDb();
    const limit = opts.limit ?? 200;
    const rows = opts.type
      ? db
          .prepare(
            "SELECT * FROM history WHERE type = ? ORDER BY created_at DESC LIMIT ?",
          )
          .all(opts.type, limit)
      : db
          .prepare("SELECT * FROM history ORDER BY created_at DESC LIMIT ?")
          .all(limit);

    return (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as number,
      type: r.type as HistoryItemType,
      input: r.input as string,
      output: r.output as string,
      output2: (r.output2 as string | null) ?? null,
      langFrom: r.lang_from as string,
      langTo: r.lang_to as string,
      provider: (r.provider as string | null) ?? null,
      createdAt: r.created_at as string,
    }));
  } catch (e) {
    console.error("[history] listHistory failed:", e);
    return [];
  }
}

export function deleteHistoryItem(id: number): void {
  try {
    getDb().prepare("DELETE FROM history WHERE id = ?").run(id);
  } catch (e) {
    console.error("[history] deleteHistoryItem failed:", e);
  }
}

export function clearHistory(): void {
  try {
    getDb().exec("DELETE FROM history");
  } catch (e) {
    console.error("[history] clearHistory failed:", e);
  }
}

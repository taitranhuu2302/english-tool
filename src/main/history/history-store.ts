import { app } from "electron";
import path from "node:path";
import { promises as fs } from "node:fs";
import type { HistoryItem, HistoryItemType } from "../../shared/types";

interface HistoryData {
  nextId: number;
  items: HistoryItem[];
}

let _historyPath: string | null = null;
let _historyCache: HistoryData | null = null;

function getHistoryPath(): string {
  if (_historyPath) return _historyPath;
  _historyPath = path.join(app.getPath("userData"), "history.json");
  console.log("[history-store] userData path:", app.getPath("userData"));
  console.log("[history-store] History file path:", _historyPath);
  return _historyPath;
}

async function loadHistory(): Promise<HistoryData> {
  if (_historyCache) return _historyCache;

  const filePath = getHistoryPath();
  try {
    const content = await fs.readFile(filePath, "utf-8");
    _historyCache = JSON.parse(content);
    console.log("[history-store] Loaded history successfully");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("[history-store] No existing history file, creating new one");
      _historyCache = { nextId: 1, items: [] };
    } else {
      console.error("[history-store] Failed to load history:", e);
      throw e;
    }
  }
  return _historyCache;
}

async function saveHistory(data: HistoryData): Promise<void> {
  const filePath = getHistoryPath();
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    _historyCache = data;
  } catch (e) {
    console.error("[history-store] Failed to save history:", e);
    throw e;
  }
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

export async function addHistory(
  params: AddHistoryParams,
  maxItems = 0,
): Promise<void> {
  try {
    const data = await loadHistory();

    const newItem: HistoryItem = {
      id: data.nextId++,
      type: params.type,
      input: params.input,
      output: params.output,
      output2: params.output2 ?? null,
      langFrom: params.langFrom,
      langTo: params.langTo,
      provider: params.provider ?? null,
      createdAt: new Date().toISOString(),
    };

    data.items.unshift(newItem);

    // Auto-prune: keep only the latest N items
    if (maxItems > 0 && data.items.length > maxItems) {
      data.items = data.items.slice(0, maxItems);
    }

    await saveHistory(data);
  } catch (e) {
    console.error("[history] addHistory failed:", e);
  }
}

export async function listHistory(
  opts: { limit?: number; type?: HistoryItemType } = {},
): Promise<HistoryItem[]> {
  try {
    const data = await loadHistory();
    const limit = opts.limit ?? 200;

    let filtered = opts.type
      ? data.items.filter((item) => item.type === opts.type)
      : data.items;

    return filtered.slice(0, limit);
  } catch (e) {
    console.error("[history] listHistory failed:", e);
    return [];
  }
}

export async function deleteHistoryItem(id: number): Promise<void> {
  try {
    const data = await loadHistory();
    data.items = data.items.filter((item) => item.id !== id);
    await saveHistory(data);
  } catch (e) {
    console.error("[history] deleteHistoryItem failed:", e);
  }
}

export async function clearHistory(): Promise<void> {
  try {
    const data = await loadHistory();
    data.items = [];
    await saveHistory(data);
  } catch (e) {
    console.error("[history] clearHistory failed:", e);
  }
}

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hasSupabaseServerConfig, supabaseServerFetch } from "@/lib/supabase/server";
import type { StudyMode, WorkspaceHistoryItem, WorkspaceLibraryItem } from "@/types";

export interface WorkspaceSnapshot {
  historyItems: WorkspaceHistoryItem[];
  libraryItems: WorkspaceLibraryItem[];
}

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const WORKSPACE_FILE = path.join(DATA_DIRECTORY, "workspaces.json");
const HISTORY_TABLE = "workspace_history";
const LIBRARY_TABLE = "workspace_library";

type WorkspaceStore = Record<string, WorkspaceSnapshot>;

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIRECTORY, { recursive: true });
    try {
      await fs.access(WORKSPACE_FILE);
    } catch {
      await fs.writeFile(WORKSPACE_FILE, JSON.stringify({}, null, 2), "utf8");
    }
  } catch {
    // Silent fail for EROFS in production
  }
}

async function readStore(): Promise<WorkspaceStore> {
  await ensureDataFile();

  try {
    const content = await fs.readFile(WORKSPACE_FILE, "utf8");
    const parsed = JSON.parse(content) as WorkspaceStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: WorkspaceStore) {
  try {
    await ensureDataFile();
    await fs.writeFile(WORKSPACE_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Local persistence failed:", err);
    }
    // Silent fail on read-only systems
  }
}

function mapHistoryRow(row: Record<string, unknown>): WorkspaceHistoryItem {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    introduction: String(row.introduction ?? ""),
    sourceText: String(row.source_text ?? ""),
    language: (row.language as WorkspaceHistoryItem["language"]) ?? "english",
    mode: (row.mode as StudyMode) ?? "summary",
    createdAt: String(row.created_at ?? new Date().toISOString()),
    resultData: row.result_data,
  };
}

function mapLibraryRow(row: Record<string, unknown>): WorkspaceLibraryItem {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    introduction: String(row.introduction ?? ""),
    sourceText: String(row.source_text ?? ""),
    language: (row.language as WorkspaceLibraryItem["language"]) ?? "english",
    lastMode: (row.last_mode as StudyMode) ?? "summary",
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
    visits: Number(row.visits ?? 1),
    resultData: row.result_data,
  };
}

async function readSupabaseSnapshot(sessionId: string): Promise<WorkspaceSnapshot> {
  const historyQuery = new URLSearchParams({
    select: "*",
    session_id: `eq.${sessionId}`,
    order: "created_at.desc",
    limit: "20",
  });
  const libraryQuery = new URLSearchParams({
    select: "*",
    session_id: `eq.${sessionId}`,
    order: "updated_at.desc",
    limit: "20",
  });

  const [historyResponse, libraryResponse] = await Promise.all([
    supabaseServerFetch(`/rest/v1/${HISTORY_TABLE}?${historyQuery.toString()}`),
    supabaseServerFetch(`/rest/v1/${LIBRARY_TABLE}?${libraryQuery.toString()}`),
  ]);

  if (!historyResponse.ok || !libraryResponse.ok) {
    const historyError = !historyResponse.ok ? await historyResponse.text() : "";
    const libraryError = !libraryResponse.ok ? await libraryResponse.text() : "";
    throw new Error(historyError || libraryError || "Unable to load workspace data from Supabase.");
  }

  const historyRows = (await historyResponse.json()) as Array<Record<string, unknown>>;
  const libraryRows = (await libraryResponse.json()) as Array<Record<string, unknown>>;

  return {
    historyItems: historyRows.map(mapHistoryRow),
    libraryItems: libraryRows.map(mapLibraryRow),
  };
}

export async function countDailyGenerations(sessionId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  
  if (hasSupabaseServerConfig()) {
    try {
      const query = new URLSearchParams({
        session_id: `eq.${sessionId}`,
        created_at: `gte.${today}T00:00:00Z`,
        select: "count",
      });
      
      const response = await supabaseServerFetch(`/rest/v1/${HISTORY_TABLE}?${query.toString()}`, {
        method: "GET",
        headers: {
          "Prefer": "count=exact",
        },
      });
      
      if (!response.ok) return 0;
      
      // Supabase REST API returns range with count in headers when Prefer: count=exact is used
      // For simplicity in this MoR fetch wrapper, we might just look at the array length if selecting *
      // or check the content-range header.
      const countHeader = response.headers.get("content-range");
      if (countHeader) {
        const parts = countHeader.split("/");
        if (parts.length > 1) return parseInt(parts[1], 10);
      }
      
      const rows = await response.json();
      return Array.isArray(rows) ? rows.length : 0;
    } catch {
      return 0; // Fallback to 0 if DB is down
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] || { historyItems: [], libraryItems: [] };
  return snapshot.historyItems.filter(item => item.createdAt.startsWith(today)).length;
}

async function writeSupabaseHistoryEntry(
  sessionId: string,
  payload: {
    id: string;
    title: string;
    introduction: string;
    sourceText: string;
    language: WorkspaceHistoryItem["language"];
    mode: StudyMode;
    createdAt: string;
    resultData?: unknown;
  }
) {
  const response = await supabaseServerFetch(`/rest/v1/${HISTORY_TABLE}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        id: payload.id,
        session_id: sessionId,
        title: payload.title,
        introduction: payload.introduction,
        source_text: payload.sourceText,
        language: payload.language,
        mode: payload.mode,
        created_at: payload.createdAt,
        result_data: payload.resultData ?? null,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function upsertSupabaseLibraryEntry(
  sessionId: string,
  payload: {
    title: string;
    introduction: string;
    sourceText: string;
    language: WorkspaceLibraryItem["language"];
    mode: StudyMode;
    updatedAt: string;
    resultData?: unknown;
  }
) {
  const existingSnapshot = await readSupabaseSnapshot(sessionId);
  const existing = existingSnapshot.libraryItems.find(
    (item) =>
      item.sourceText.trim().toLowerCase() === payload.sourceText.trim().toLowerCase() &&
      item.language === payload.language
  );

  if (existing) {
    const query = new URLSearchParams({ id: `eq.${existing.id}` });
    const response = await supabaseServerFetch(`/rest/v1/${LIBRARY_TABLE}?${query.toString()}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        title: payload.title,
        introduction: payload.introduction,
        last_mode: payload.mode,
        updated_at: payload.updatedAt,
        visits: existing.visits + 1,
        result_data: payload.resultData ?? null,
      }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return;
  }

  const response = await supabaseServerFetch(`/rest/v1/${LIBRARY_TABLE}`, {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        session_id: sessionId,
        title: payload.title,
        introduction: payload.introduction,
        source_text: payload.sourceText,
        language: payload.language,
        last_mode: payload.mode,
        updated_at: payload.updatedAt,
        visits: 1,
        result_data: payload.resultData ?? null,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function createWorkspaceSessionId() {
  return randomUUID();
}

export async function getWorkspaceSnapshot(sessionId: string): Promise<WorkspaceSnapshot> {
  if (hasSupabaseServerConfig()) {
    try {
      return await readSupabaseSnapshot(sessionId);
    } catch {
      // Fall back to local JSON store when Supabase is not ready yet.
    }
  }

  const store = await readStore();
  return store[sessionId] ?? { historyItems: [], libraryItems: [] };
}

export async function recordWorkspaceEntry(
  sessionId: string,
  payload: {
    title?: string;
    introduction?: string;
    sourceText: string;
    language: WorkspaceHistoryItem["language"];
    mode: StudyMode;
    resultData?: unknown;
  }
) {
  const now = new Date().toISOString();
  const title = deriveWorkspaceTitle(payload.title, payload.sourceText);
  const introduction = deriveWorkspaceIntroduction(payload.introduction, payload.sourceText);
  const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  if (hasSupabaseServerConfig()) {
    try {
      await writeSupabaseHistoryEntry(sessionId, {
        id: historyId,
        title,
        introduction,
        sourceText: payload.sourceText,
        language: payload.language,
        mode: payload.mode,
        createdAt: now,
        resultData: payload.resultData,
      });

      await upsertSupabaseLibraryEntry(sessionId, {
        title,
        introduction,
        sourceText: payload.sourceText,
        language: payload.language,
        mode: payload.mode,
        updatedAt: now,
        resultData: payload.resultData,
      });

      return await readSupabaseSnapshot(sessionId);
    } catch {
      // Fall back to local JSON store when Supabase schema is not ready yet.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { historyItems: [], libraryItems: [] };

  const historyItem: WorkspaceHistoryItem = {
    id: historyId,
    title,
    introduction,
    sourceText: payload.sourceText,
    language: payload.language,
    mode: payload.mode,
    createdAt: now,
    resultData: payload.resultData,
  };

  const existingLibraryItem = snapshot.libraryItems.find(
    (item) =>
      item.sourceText.trim().toLowerCase() === payload.sourceText.trim().toLowerCase() &&
      item.language === payload.language
  );

  const libraryItems = existingLibraryItem
    ? snapshot.libraryItems.map((item) =>
        item.id === existingLibraryItem.id
          ? {
              ...item,
              title,
              introduction,
              lastMode: payload.mode,
              updatedAt: now,
              visits: item.visits + 1,
              resultData: payload.resultData,
            }
          : item
      )
    : [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          introduction,
          sourceText: payload.sourceText,
          language: payload.language,
          lastMode: payload.mode,
          updatedAt: now,
          visits: 1,
          resultData: payload.resultData,
        },
        ...snapshot.libraryItems,
      ].slice(0, 20);

  store[sessionId] = {
    historyItems: [historyItem, ...snapshot.historyItems].slice(0, 20),
    libraryItems,
  };

  await writeStore(store);
  return store[sessionId];
}

export async function clearWorkspaceCollection(
  sessionId: string,
  collection: "history" | "library"
) {
  if (hasSupabaseServerConfig()) {
    try {
      const query = new URLSearchParams({ session_id: `eq.${sessionId}` });
      const table = collection === "history" ? HISTORY_TABLE : LIBRARY_TABLE;
      const response = await supabaseServerFetch(`/rest/v1/${table}?${query.toString()}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return await readSupabaseSnapshot(sessionId);
    } catch {
      // Fall back to local JSON store when Supabase schema is not ready yet.
    }
  }

  const store = await readStore();
  const snapshot = store[sessionId] ?? { historyItems: [], libraryItems: [] };

  store[sessionId] = {
    historyItems: collection === "history" ? [] : snapshot.historyItems,
    libraryItems: collection === "library" ? [] : snapshot.libraryItems,
  };

  await writeStore(store);
  return store[sessionId];
}

function deriveWorkspaceTitle(candidate: string | undefined, sourceText: string) {
  const trimmedCandidate = candidate?.trim();
  if (trimmedCandidate) {
    return trimmedCandidate;
  }

  const firstLine = sourceText.trim().split("\n")[0] || "Study Session";
  return firstLine.slice(0, 80);
}

function deriveWorkspaceIntroduction(candidate: string | undefined, sourceText: string) {
  const trimmedCandidate = candidate?.trim();
  if (trimmedCandidate) {
    return trimmedCandidate;
  }

  return sourceText.trim().slice(0, 140) || "Saved study session.";
}

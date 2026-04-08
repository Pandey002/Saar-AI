import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StudyMode, WorkspaceHistoryItem, WorkspaceLibraryItem } from "@/types";

export interface WorkspaceSnapshot {
  historyItems: WorkspaceHistoryItem[];
  libraryItems: WorkspaceLibraryItem[];
}

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const WORKSPACE_FILE = path.join(DATA_DIRECTORY, "workspaces.json");

type WorkspaceStore = Record<string, WorkspaceSnapshot>;

async function ensureDataFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(WORKSPACE_FILE);
  } catch {
    await fs.writeFile(WORKSPACE_FILE, JSON.stringify({}, null, 2), "utf8");
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
  await ensureDataFile();
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function createWorkspaceSessionId() {
  return randomUUID();
}

export async function getWorkspaceSnapshot(sessionId: string): Promise<WorkspaceSnapshot> {
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
  }
) {
  const store = await readStore();
  const snapshot = store[sessionId] ?? { historyItems: [], libraryItems: [] };
  const now = new Date().toISOString();
  const title = deriveWorkspaceTitle(payload.title, payload.sourceText);
  const introduction = deriveWorkspaceIntroduction(payload.introduction, payload.sourceText);

  const historyItem: WorkspaceHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    introduction,
    sourceText: payload.sourceText,
    language: payload.language,
    mode: payload.mode,
    createdAt: now,
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

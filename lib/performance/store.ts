import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { analyzePerformance } from "@/lib/performance/analyze";
import type { PerformanceInsightSnapshot, PerformanceLogEntry, WeakAreaRevisionPack } from "@/types";

interface PerformanceSessionStore {
  logs: PerformanceLogEntry[];
  cachedInsights: PerformanceInsightSnapshot | null;
  revisionPacks: Record<string, WeakAreaRevisionPack>;
}

type PerformanceStore = Record<string, PerformanceSessionStore>;

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const PERFORMANCE_FILE = path.join(DATA_DIRECTORY, "performance.json");

async function ensureDataFile() {
  await fs.mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await fs.access(PERFORMANCE_FILE);
  } catch {
    await fs.writeFile(PERFORMANCE_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

async function readStore(): Promise<PerformanceStore> {
  await ensureDataFile();

  try {
    const content = await fs.readFile(PERFORMANCE_FILE, "utf8");
    const parsed = JSON.parse(content) as PerformanceStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: PerformanceStore) {
  await ensureDataFile();
  await fs.writeFile(PERFORMANCE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function getSession(store: PerformanceStore, sessionId: string): PerformanceSessionStore {
  return store[sessionId] ?? { logs: [], cachedInsights: null, revisionPacks: {} };
}

export async function recordPerformanceLogs(
  sessionId: string,
  entries: Array<Omit<PerformanceLogEntry, "id" | "userId">>
) {
  if (entries.length === 0) {
    return getPerformanceInsights(sessionId);
  }

  const store = await readStore();
  const session = getSession(store, sessionId);

  const nextLogs = [
    ...entries.map((entry) => ({
      ...entry,
      id: randomUUID(),
      userId: sessionId,
    })),
    ...session.logs,
  ].slice(0, 500);

  const nextInsights = analyzePerformance(nextLogs);
  store[sessionId] = {
    logs: nextLogs,
    cachedInsights: nextInsights,
    revisionPacks: session.revisionPacks,
  };

  await writeStore(store);
  return nextInsights;
}

export async function getPerformanceInsights(sessionId: string) {
  const store = await readStore();
  const session = getSession(store, sessionId);

  if (session.cachedInsights) {
    return session.cachedInsights;
  }

  const nextInsights = analyzePerformance(session.logs);
  store[sessionId] = {
    ...session,
    cachedInsights: nextInsights,
  };
  await writeStore(store);
  return nextInsights;
}

export async function cacheWeakAreaRevisionPack(
  sessionId: string,
  topic: string,
  pack: WeakAreaRevisionPack
) {
  const store = await readStore();
  const session = getSession(store, sessionId);
  store[sessionId] = {
    ...session,
    revisionPacks: {
      ...session.revisionPacks,
      [topic.toLowerCase()]: pack,
    },
  };
  await writeStore(store);
  return pack;
}

export async function getCachedWeakAreaRevisionPack(sessionId: string, topic: string) {
  const store = await readStore();
  const session = getSession(store, sessionId);
  return session.revisionPacks[topic.toLowerCase()] ?? null;
}

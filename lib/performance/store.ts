import { analyzePerformance } from "@/lib/performance/analyze";
import { performanceStore, type PerformanceLogRecord } from "@/lib/localDB";
import type { PerformanceInsightSnapshot, PerformanceLogEntry, WeakAreaRevisionPack } from "@/types";

export async function recordPerformanceLogs(
  sessionId: string,
  entries: Array<Omit<PerformanceLogEntry, "id" | "userId">>
) {
  if (entries.length === 0) {
    return getPerformanceInsights(sessionId);
  }

  // Save each log to IndexedDB
  for (const entry of entries) {
    const record: PerformanceLogRecord = {
      ...(entry as any),
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      userId: sessionId,
      synced: false,
    } as PerformanceLogRecord;
    await performanceStore.saveLog(record);
  }

  // Recalculate insights
  const allLogs = await performanceStore.getLogs(sessionId);
  const nextInsights = analyzePerformance(allLogs);

  // Get existing insight to preserve revision packs
  const existing = await performanceStore.getInsight(sessionId);
  
  await performanceStore.saveInsight({
    sessionId,
    snapshot: nextInsights,
    revisionPacks: existing?.revisionPacks ?? {},
    updatedAt: new Date().toISOString(),
  });

  return nextInsights;
}

export async function getPerformanceInsights(sessionId: string) {
  const record = await performanceStore.getInsight(sessionId);
  
  if (record?.snapshot) {
    return record.snapshot;
  }

  const logs = await performanceStore.getLogs(sessionId);
  const nextInsights = analyzePerformance(logs);
  
  await performanceStore.saveInsight({
    sessionId,
    snapshot: nextInsights,
    revisionPacks: record?.revisionPacks ?? {},
    updatedAt: new Date().toISOString(),
  });
  
  return nextInsights;
}

export async function cacheWeakAreaRevisionPack(
  sessionId: string,
  topic: string,
  pack: WeakAreaRevisionPack
) {
  const record = await performanceStore.getInsight(sessionId);
  const existingSnapshot = record?.snapshot ?? await getPerformanceInsights(sessionId);
  
  await performanceStore.saveInsight({
    sessionId,
    snapshot: existingSnapshot,
    revisionPacks: {
      ...(record?.revisionPacks ?? {}),
      [topic.toLowerCase()]: pack,
    },
    updatedAt: new Date().toISOString(),
  });
  
  return pack;
}

export async function getCachedWeakAreaRevisionPack(sessionId: string, topic: string) {
  const record = await performanceStore.getInsight(sessionId);
  return record?.revisionPacks[topic.toLowerCase()] ?? null;
}

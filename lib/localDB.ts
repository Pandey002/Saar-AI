import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { 
  LanguageMode, 
  StudyMode, 
  TopicType, 
  PerformanceInsightSnapshot, 
  WeakAreaRevisionPack,
  PerformanceLogEntry
} from "@/types";

const DB_NAME = "saar-ai-offline";
const DB_VERSION = 3;

export interface SessionRecord {
  id: string;
  topic: string;
  mode: StudyMode;
  language: LanguageMode;
  sourceText: string;
  output: unknown;
  subject: string;
  topicType: TopicType | "general";
  createdAt: string;
  synced: boolean;
}

export interface FlashcardRecord {
  id: string;
  deckId: string;
  sessionId: string;
  deckTitle: string;
  deckSubject: string;
  deckCreatedAt: string;
  front: string;
  back: string;
  type: "concept" | "formula" | "date" | "process" | "definition";
  tags: string[];
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  lastReviewDate: string | null;
  createdAt: string;
  synced: boolean;
}

export interface PendingReviewRecord {
  id: string;
  cardId: string;
  sessionId: string;
  rating: 1 | 2 | 4 | 5;
  timeTakenMs: number | null;
  reviewedAt: string;
  synced: boolean;
}

interface AppStateRecord {
  key: string;
  value: unknown;
}

export interface PerformanceLogRecord extends PerformanceLogEntry {
  synced: boolean;
}

export interface PerformanceInsightRecord {
  sessionId: string;
  snapshot: PerformanceInsightSnapshot;
  revisionPacks: Record<string, WeakAreaRevisionPack>;
  updatedAt: string;
}

interface SaarOfflineDB extends DBSchema {
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: {
      "by-createdAt": string;
      "by-synced": number;
    };
  };
  flashcards: {
    key: string;
    value: FlashcardRecord;
    indexes: {
      "by-deckId": string;
      "by-nextReviewDate": string;
      "by-synced": number;
    };
  };
  pendingReviews: {
    key: string;
    value: PendingReviewRecord;
    indexes: {
      "by-reviewedAt": string;
      "by-synced": number;
    };
  };
  appState: {
    key: string;
    value: AppStateRecord;
  };
  performanceLogs: {
    key: string;
    value: PerformanceLogRecord;
    indexes: {
      "by-sessionId": string;
      "by-timestamp": string;
      "by-synced": number;
    };
  };
  performanceInsights: {
    key: string;
    value: PerformanceInsightRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<SaarOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SaarOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionsStore = db.createObjectStore("sessions", { keyPath: "id" });
          sessionsStore.createIndex("by-createdAt", "createdAt");
          sessionsStore.createIndex("by-synced", "synced");
        }

        if (!db.objectStoreNames.contains("flashcards")) {
          const flashcardsStore = db.createObjectStore("flashcards", { keyPath: "id" });
          flashcardsStore.createIndex("by-deckId", "deckId");
          flashcardsStore.createIndex("by-nextReviewDate", "nextReviewDate");
          flashcardsStore.createIndex("by-synced", "synced");
        }

        if (!db.objectStoreNames.contains("pendingReviews")) {
          const pendingReviewsStore = db.createObjectStore("pendingReviews", { keyPath: "id" });
          pendingReviewsStore.createIndex("by-reviewedAt", "reviewedAt");
          pendingReviewsStore.createIndex("by-synced", "synced");
        }

        if (!db.objectStoreNames.contains("appState")) {
          db.createObjectStore("appState", { keyPath: "key" });
        }

        if (!db.objectStoreNames.contains("performanceLogs")) {
          const perfStore = db.createObjectStore("performanceLogs", { keyPath: "id" });
          perfStore.createIndex("by-sessionId", "sessionId");
          perfStore.createIndex("by-timestamp", "timestamp");
          perfStore.createIndex("by-synced", "synced");
        }

        if (!db.objectStoreNames.contains("performanceInsights")) {
          db.createObjectStore("performanceInsights", { keyPath: "sessionId" });
        }
      },
    });
  }

  return dbPromise;
}

async function getUnsyncedSessions() {
  const db = await getDb();
  return db.getAllFromIndex("sessions", "by-synced", 0);
}

async function getUnsyncedFlashcards() {
  const db = await getDb();
  return db.getAllFromIndex("flashcards", "by-synced", 0);
}

async function getUnsyncedPendingReviews() {
  const db = await getDb();
  return db.getAllFromIndex("pendingReviews", "by-synced", 0);
}

function toSyncedIndex(value: boolean) {
  return value ? 1 : 0;
}

export const sessionStore = {
  async save(record: SessionRecord) {
    const db = await getDb();
    await db.put("sessions", { ...record, synced: Boolean(record.synced) });
  },
  async get(id: string) {
    const db = await getDb();
    return db.get("sessions", id);
  },
  async getAll() {
    const db = await getDb();
    const records = await db.getAll("sessions");
    return records.sort((left, right) => {
      const timeA = left.createdAt || "";
      const timeB = right.createdAt || "";
      return timeB.localeCompare(timeA);
    });
  },
  async getUnsynced() {
    return getUnsyncedSessions();
  },
  async markSynced(ids: string[]) {
    const db = await getDb();
    const tx = db.transaction("sessions", "readwrite");
    await Promise.all(
      ids.map(async (id) => {
        const record = await tx.store.get(id);
        if (record) {
          await tx.store.put({ ...record, synced: true });
        }
      })
    );
    await tx.done;
  },
  async delete(id: string) {
    const db = await getDb();
    await db.delete("sessions", id);
  },
  async deleteSyncedOlderThan(cutoffIso: string) {
    const db = await getDb();
    const records = await db.getAll("sessions");
    const deletable = records.filter((record) => record.synced && record.createdAt < cutoffIso);
    const tx = db.transaction("sessions", "readwrite");
    await Promise.all(deletable.map((record) => tx.store.delete(record.id)));
    await tx.done;
    return deletable.length;
  },
  async clear() {
    const db = await getDb();
    await db.clear("sessions");
  },
};

export const flashcardStore = {
  async save(record: FlashcardRecord) {
    const db = await getDb();
    await db.put("flashcards", { ...record, synced: Boolean(record.synced) });
  },
  async get(id: string) {
    const db = await getDb();
    return db.get("flashcards", id);
  },
  async getAll() {
    const db = await getDb();
    const records = await db.getAll("flashcards");
    return records.sort((left, right) => {
      const timeA = left.createdAt || "";
      const timeB = right.createdAt || "";
      return timeB.localeCompare(timeA);
    });
  },
  async getUnsynced() {
    return getUnsyncedFlashcards();
  },
  async markSynced(ids: string[]) {
    const db = await getDb();
    const tx = db.transaction("flashcards", "readwrite");
    await Promise.all(
      ids.map(async (id) => {
        const record = await tx.store.get(id);
        if (record) {
          await tx.store.put({ ...record, synced: true });
        }
      })
    );
    await tx.done;
  },
  async delete(id: string) {
    const db = await getDb();
    await db.delete("flashcards", id);
  },
  async deleteDeck(deckId: string) {
    const db = await getDb();
    const records = await db.getAllFromIndex("flashcards", "by-deckId", deckId);
    const tx = db.transaction("flashcards", "readwrite");
    await Promise.all(records.map((record) => tx.store.delete(record.id)));
    await tx.done;
  },
  async clear() {
    const db = await getDb();
    await db.clear("flashcards");
  },
};

export const pendingReviewStore = {
  async save(record: PendingReviewRecord) {
    const db = await getDb();
    await db.put("pendingReviews", { ...record, synced: Boolean(record.synced) });
  },
  async get(id: string) {
    const db = await getDb();
    return db.get("pendingReviews", id);
  },
  async getAll() {
    const db = await getDb();
    const records = await db.getAll("pendingReviews");
    return records.sort((left, right) => {
      const timeA = left.reviewedAt || "";
      const timeB = right.reviewedAt || "";
      return timeB.localeCompare(timeA);
    });
  },
  async getUnsynced() {
    return getUnsyncedPendingReviews();
  },
  async markSynced(ids: string[]) {
    const db = await getDb();
    const tx = db.transaction("pendingReviews", "readwrite");
    await Promise.all(
      ids.map(async (id) => {
        const record = await tx.store.get(id);
        if (record) {
          await tx.store.put({ ...record, synced: true });
        }
      })
    );
    await tx.done;
  },
  async delete(id: string) {
    const db = await getDb();
    await db.delete("pendingReviews", id);
  },
};

export const performanceStore = {
  async saveLog(record: PerformanceLogRecord) {
    const db = await getDb();
    await db.put("performanceLogs", record);
  },
  async getLogs(sessionId: string) {
    const db = await getDb();
    return db.getAllFromIndex("performanceLogs", "by-sessionId", sessionId);
  },
  async clearLogs(sessionId: string) {
    const db = await getDb();
    const logs = await this.getLogs(sessionId);
    const tx = db.transaction("performanceLogs", "readwrite");
    await Promise.all(logs.map((log) => tx.store.delete(log.id)));
    await tx.done;
  },
  async saveInsight(record: PerformanceInsightRecord) {
    const db = await getDb();
    await db.put("performanceInsights", record);
  },
  async getInsight(sessionId: string) {
    const db = await getDb();
    return db.get("performanceInsights", sessionId);
  },
};

export async function setAppStateValue<T>(key: string, value: T) {
  const db = await getDb();
  await db.put("appState", { key, value });
}

export async function getAppStateValue<T>(key: string) {
  const db = await getDb();
  const record = await db.get("appState", key);
  return (record?.value as T | undefined) ?? null;
}

export async function getStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  return {
    quota: estimate.quota ?? 0,
    usage: estimate.usage ?? 0,
  };
}

export function encodeSynced(value: boolean) {
  return toSyncedIndex(value);
}

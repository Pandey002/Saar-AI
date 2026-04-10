import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { LanguageMode, StudyMode, TopicType } from "@/types";

const DB_NAME = "saar-ai-offline";
const DB_VERSION = 1;

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
}

let dbPromise: Promise<IDBPDatabase<SaarOfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<SaarOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sessionsStore = db.createObjectStore("sessions", { keyPath: "id" });
        sessionsStore.createIndex("by-createdAt", "createdAt");
        sessionsStore.createIndex("by-synced", "synced");

        const flashcardsStore = db.createObjectStore("flashcards", { keyPath: "id" });
        flashcardsStore.createIndex("by-deckId", "deckId");
        flashcardsStore.createIndex("by-nextReviewDate", "nextReviewDate");
        flashcardsStore.createIndex("by-synced", "synced");

        const pendingReviewsStore = db.createObjectStore("pendingReviews", { keyPath: "id" });
        pendingReviewsStore.createIndex("by-reviewedAt", "reviewedAt");
        pendingReviewsStore.createIndex("by-synced", "synced");

        db.createObjectStore("appState", { keyPath: "key" });
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
    return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
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
    return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
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
    return records.sort((left, right) => right.reviewedAt.localeCompare(left.reviewedAt));
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

"use client";

import {
  flashcardStore,
  getAppStateValue,
  pendingReviewStore,
  sessionStore,
  setAppStateValue,
  type FlashcardRecord,
  type PendingReviewRecord,
  type SessionRecord,
} from "@/lib/localDB";

type SyncPhase = "idle" | "syncing" | "success" | "error";

interface SyncStatusDetail {
  phase: SyncPhase;
  syncedCount: number;
  message?: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const STATUS_EVENT = "vidya-sync-status";
let isSyncing = false;
let isRegistered = false;

function emitStatus(detail: SyncStatusDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent<SyncStatusDetail>(STATUS_EVENT, { detail }));
}

async function supabaseRestFetch(path: string, init?: RequestInit) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase browser configuration is missing.");
  }

  const response = await fetch(new URL(path, SUPABASE_URL).toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return response;
}

function deriveIntroduction(output: unknown, sourceText: string) {
  if (output && typeof output === "object" && "introduction" in output && typeof output.introduction === "string") {
    return output.introduction.trim() || sourceText.trim().slice(0, 140);
  }

  return sourceText.trim().slice(0, 140) || "Saved study session.";
}

function deriveTitle(topic: string, sourceText: string, output: unknown) {
  if (output && typeof output === "object" && "title" in output && typeof output.title === "string") {
    return output.title.trim() || topic.trim() || sourceText.trim().slice(0, 80) || "Study Session";
  }

  return topic.trim() || sourceText.trim().split("\n")[0]?.slice(0, 80) || "Study Session";
}

function buildLibraryId(sessionId: string, sourceText: string, language: string) {
  let hash = 0;
  const input = `${sessionId}:${language}:${sourceText.trim().toLowerCase()}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `library-${hash.toString(16)}`;
}

function isDuplicateReviewInsertError(message: string) {
  const lowered = message.toLowerCase();
  return lowered.includes("duplicate key") || lowered.includes("already exists") || lowered.includes("23505");
}

export async function syncOfflineData(sessionId: string) {
  if (isSyncing || typeof window === "undefined" || !navigator.onLine || !sessionId) {
    return { syncedCount: 0 };
  }

  isSyncing = true;
  emitStatus({ phase: "syncing", syncedCount: 0 });

  try {
    const [unsyncedSessions, allSessions, unsyncedFlashcards, unsyncedPendingReviews] = await Promise.all([
      sessionStore.getUnsynced(),
      sessionStore.getAll(),
      flashcardStore.getUnsynced(),
      pendingReviewStore.getUnsynced(),
    ]);

    let syncedCount = 0;

    if (unsyncedSessions.length > 0) {
      const historyPayload = unsyncedSessions.map((session: SessionRecord) => ({
        id: session.id,
        session_id: sessionId,
        title: deriveTitle(session.topic, session.sourceText, session.output),
        introduction: deriveIntroduction(session.output, session.sourceText),
        source_text: session.sourceText,
        language: session.language,
        mode: session.mode,
        created_at: session.createdAt,
        result_data: session.output,
      }));

      const libraryPayload = unsyncedSessions.map((session: SessionRecord) => {
        const visits = allSessions.filter(
          (candidate: SessionRecord) =>
            candidate.language === session.language &&
            candidate.sourceText.trim().toLowerCase() === session.sourceText.trim().toLowerCase()
        ).length;

        return {
          id: buildLibraryId(sessionId, session.sourceText, session.language),
          session_id: sessionId,
          title: deriveTitle(session.topic, session.sourceText, session.output),
          introduction: deriveIntroduction(session.output, session.sourceText),
          source_text: session.sourceText,
          language: session.language,
          last_mode: session.mode,
          updated_at: session.createdAt,
          visits: Math.max(visits, 1),
          result_data: session.output,
        };
      });

      const [historyResponse, libraryResponse] = await Promise.all([
        supabaseRestFetch("/rest/v1/workspace_history?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(historyPayload),
        }),
        supabaseRestFetch("/rest/v1/workspace_library?on_conflict=id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify(libraryPayload),
        }),
      ]);

      if (!historyResponse.ok || !libraryResponse.ok) {
        throw new Error((!historyResponse.ok ? await historyResponse.text() : "") || (!libraryResponse.ok ? await libraryResponse.text() : ""));
      }

      await sessionStore.markSynced(unsyncedSessions.map((session: SessionRecord) => session.id));
      syncedCount += unsyncedSessions.length;
    }

    if (unsyncedFlashcards.length > 0) {
      const response = await supabaseRestFetch("/rest/v1/flashcards?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(
          unsyncedFlashcards.map((card: FlashcardRecord) => ({
            id: card.id,
            deck_id: card.deckId,
            session_id: card.sessionId,
            front: card.front,
            back: card.back,
            type: card.type,
            tags: card.tags,
            ease_factor: card.easeFactor,
            interval_days: card.intervalDays,
            repetitions: card.repetitions,
            next_review_date: card.nextReviewDate,
            last_review_date: card.lastReviewDate,
            created_at: card.createdAt,
          }))
        ),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      await flashcardStore.markSynced(unsyncedFlashcards.map((card: FlashcardRecord) => card.id));
      syncedCount += unsyncedFlashcards.length;
    }

    if (unsyncedPendingReviews.length > 0) {
      const response = await supabaseRestFetch("/rest/v1/review_log", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(
          unsyncedPendingReviews.map((review: PendingReviewRecord) => ({
            id: review.id,
            card_id: review.cardId,
            session_id: review.sessionId,
            rating: review.rating,
            time_taken_ms: review.timeTakenMs,
            reviewed_at: review.reviewedAt,
          }))
        ),
      });

      if (!response.ok) {
        const message = await response.text();
        if (!isDuplicateReviewInsertError(message)) {
          throw new Error(message);
        }
      }

      await pendingReviewStore.markSynced(unsyncedPendingReviews.map((review: PendingReviewRecord) => review.id));
      syncedCount += unsyncedPendingReviews.length;
    }

    const syncedAt = new Date().toISOString();
    await setAppStateValue("lastSyncedAt", syncedAt);
    emitStatus({ phase: "success", syncedCount });
    return { syncedCount, lastSyncedAt: syncedAt };
  } catch (error) {
    emitStatus({
      phase: "error",
      syncedCount: 0,
      message: error instanceof Error ? error.message : "Unable to sync offline activity.",
    });
    throw error;
  } finally {
    isSyncing = false;
  }
}

export function registerSyncOnReconnect(sessionId: string) {
  if (typeof window === "undefined" || !sessionId || isRegistered) {
    return () => undefined;
  }

  isRegistered = true;
  const syncNow = () => {
    void syncOfflineData(sessionId).catch(() => undefined);
  };

  void getAppStateValue<string>("lastSyncedAt");
  syncNow();
  window.addEventListener("online", syncNow);

  return () => {
    isRegistered = false;
    window.removeEventListener("online", syncNow);
  };
}

export function subscribeToSyncStatus(listener: (detail: SyncStatusDetail) => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SyncStatusDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(STATUS_EVENT, handler as EventListener);
  return () => {
    window.removeEventListener(STATUS_EVENT, handler as EventListener);
  };
}

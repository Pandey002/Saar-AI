"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { subscribeToSyncStatus } from "@/lib/syncEngine";

interface BannerState {
  phase: "idle" | "syncing" | "success" | "error";
  syncedCount: number;
  message?: string;
}

export function OfflineBanner() {
  const pathname = usePathname();
  const { isOnline, wasOffline } = useOnlineStatus();
  const [syncState, setSyncState] = useState<BannerState>({ phase: "idle", syncedCount: 0 });

  useEffect(() => subscribeToSyncStatus(setSyncState), []);

  useEffect(() => {
    if (!wasOffline || syncState.phase !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setSyncState((current) => (current.phase === "success" ? { phase: "idle", syncedCount: 0 } : current));
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [syncState.phase, wasOffline]);

  if (!pathname?.startsWith("/dashboard")) {
    return null;
  }

  if (!isOnline) {
    return (
      <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        You&apos;re offline. Previously saved sessions, library items, and flashcards still work. Connect to the internet to generate new content.
      </div>
    );
  }

  if (syncState.phase === "syncing") {
    return (
      <div className="sticky top-0 z-50 border-b border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        Back online. Syncing your offline activity...
      </div>
    );
  }

  if (syncState.phase === "success" && (wasOffline || syncState.syncedCount > 0)) {
    return (
      <div className="sticky top-0 z-50 border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Back online. {syncState.syncedCount} item{syncState.syncedCount === 1 ? "" : "s"} synced.
      </div>
    );
  }

  return null;
}

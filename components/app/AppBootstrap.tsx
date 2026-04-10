"use client";

import { useEffect } from "react";
import { getClientSessionId } from "@/lib/clientSession";
import { registerSyncOnReconnect } from "@/lib/syncEngine";

export function AppBootstrap() {
  useEffect(() => {
    const sessionId = getClientSessionId();
    return registerSyncOnReconnect(sessionId);
  }, []);

  return null;
}

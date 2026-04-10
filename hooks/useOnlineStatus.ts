"use client";

import { useEffect, useRef, useState } from "react";
import { probeAppConnectivity } from "@/lib/networkStatus";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const offlineRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let reconnectTimer: number | null = null;
    let isActive = true;

    const updateOnlineState = (nextOnline: boolean) => {
      setIsOnline(nextOnline);

      if (nextOnline) {
        if (!offlineRef.current) {
          return;
        }

        offlineRef.current = false;
        setWasOffline(true);
        if (reconnectTimer) {
          window.clearTimeout(reconnectTimer);
        }
        reconnectTimer = window.setTimeout(() => {
          setWasOffline(false);
        }, 3000);
        return;
      }

      offlineRef.current = true;
      setWasOffline(false);
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };

    const syncConnectivity = async () => {
      const nextOnline = await probeAppConnectivity();
      if (!isActive) {
        return;
      }
      updateOnlineState(nextOnline);
    };

    const handleOnline = () => {
      void syncConnectivity();
    };

    const handleOffline = () => {
      updateOnlineState(false);
    };

    void syncConnectivity();
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      isActive = false;
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
    };
  }, []);

  return { isOnline, wasOffline };
}

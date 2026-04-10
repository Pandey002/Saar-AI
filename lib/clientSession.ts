const CLIENT_SESSION_KEY = "saar_workspace_session_client";

export function getClientSessionId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(CLIENT_SESSION_KEY);
  if (existing) {
    return existing;
  }

  const nextSessionId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(CLIENT_SESSION_KEY, nextSessionId);
  return nextSessionId;
}

export function withClientSessionHeaders(init?: RequestInit): RequestInit {
  if (typeof window === "undefined") {
    return init ?? {};
  }

  return {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      "x-saar-session-id": getClientSessionId(),
    },
  };
}

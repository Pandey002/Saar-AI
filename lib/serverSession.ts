import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "saar_workspace_session";

export async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const headerSessionId = headerStore.get("x-saar-session-id")?.trim();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;

  const sessionId = existing || headerSessionId || crypto.randomUUID();

  if (!existing || (headerSessionId && existing !== headerSessionId)) {
    cookieStore.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return sessionId;
}

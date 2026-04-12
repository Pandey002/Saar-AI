import { NextResponse } from "next/server";
import { getPerformanceInsights } from "@/lib/performance/store";
import { getOrCreateSessionId } from "@/lib/serverSession";

export async function GET() {
  try {
    const sessionId = await getOrCreateSessionId();
    const snapshot = await getPerformanceInsights(sessionId);
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load performance insights.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

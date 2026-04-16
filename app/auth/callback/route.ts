import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Use a more robust origin detection to handle HTTPS proxies
  const protocol = request.headers.get("x-forwarded-proto") === "https" ? "https" : requestUrl.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") || requestUrl.host;
  const origin = `${protocol}://${host}`;

  console.log("Auth Callback: Starting code exchange...", { origin, next });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log("Auth Callback: Success, redirecting to", next);
      return NextResponse.redirect(`${origin}${next}`);
    }
    
    console.error("Auth Callback: Code exchange error", error);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Could not authenticate user: " + (code ? "Exchange failed" : "No code provided"))}`);
}

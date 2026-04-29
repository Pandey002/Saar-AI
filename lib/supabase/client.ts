import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client that doesn't crash but logs warnings
    console.warn("Supabase credentials missing. Authentication will be disabled.");
    return createBrowserClient(
      "https://dummy.supabase.co",
      "dummy-key"
    );
  }

  return createBrowserClient(url, key);
}

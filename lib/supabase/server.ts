const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabaseServerConfig() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

export function getSupabaseUrl() {
  return supabaseUrl;
}

export function getSupabaseAnonKey() {
  return supabaseAnonKey;
}

export async function supabaseServerFetch(path: string, init?: RequestInit) {
  if (!hasSupabaseServerConfig()) {
    throw new Error("Supabase server configuration is missing.");
  }

  const response = await fetch(new URL(path, supabaseUrl).toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  return response;
}

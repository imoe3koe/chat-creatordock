"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseConfigured } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (!client) {
    client = createBrowserClient(env.url, env.anonKey);
  }

  return client;
}

export { isSupabaseConfigured };

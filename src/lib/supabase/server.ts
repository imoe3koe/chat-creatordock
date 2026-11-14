import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Profile } from "@/lib/types";
import { getSupabaseEnv } from "./env";

export async function createSupabaseServerClient() {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies. Middleware refreshes the
          // session and writes the updated cookies for us.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (data) return data as Profile;

  // The database trigger normally creates this row at signup. This fallback
  // keeps the app usable if an auth user predates the trigger.
  const metadata = user.user_metadata ?? {};
  const fallbackUsername =
    typeof metadata.username === "string" && metadata.username.length >= 3
      ? metadata.username
      : `user_${user.id.slice(0, 8)}`;

  const { data: created } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username: fallbackUsername,
        full_name:
          (typeof metadata.full_name === "string" && metadata.full_name) ||
          fallbackUsername,
        avatar_url:
          typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
      },
      { onConflict: "id" },
    )
    .select("*")
    .maybeSingle();

  return (created as Profile | null) ?? null;
}

export async function getSessionUserAndProfile() {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };
  const profile = await getCurrentProfile();
  return { user, profile };
}

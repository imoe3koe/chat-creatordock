export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase belum dikonfigurasi. Salin .env.example ke .env.local lalu isi URL dan anon key project Supabase Anda.";

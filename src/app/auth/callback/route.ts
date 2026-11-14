import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { safeInternalPath } from "@/lib/security/redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeInternalPath(url.searchParams.get("next"));

  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.redirect(new URL("/login?error=config", url.origin));
  }

  const redirectUrl = new URL(next, url.origin);
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL("/login?error=link-expired", url.origin),
        );
      }
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "recovery" | "invite" | "magiclink" | "signup",
      });
      if (error) {
        return NextResponse.redirect(
          new URL("/login?error=link-expired", url.origin),
        );
      }
    } else {
      return NextResponse.redirect(new URL("/login?error=missing-code", url.origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=callback", url.origin));
  }

  return response;
}

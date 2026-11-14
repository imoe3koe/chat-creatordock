import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/auth",
  "/p",
  "/blog",
  "/offline",
  "/sw.js",
  "/api/wordpress-health",
];

const AUTH_ENTRY_PATHS = ["/login", "/register"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let user = null;
  try {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    user = currentUser;
  } catch {
    return response;
  }

  const { pathname, search } = request.nextUrl;
  const isPublic =
    matchesPrefix(pathname, PUBLIC_PATHS) ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml";

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && matchesPrefix(pathname, AUTH_ENTRY_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

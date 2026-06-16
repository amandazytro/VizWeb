import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Server-side password gate (option B) ──────────────────────────────────────
// Until a valid auth cookie is present (set by POST /api/auth after the correct
// password), every page request is redirected to /login. The password itself
// lives only in env (SITE_PASSWORD) and never reaches the client; the cookie
// holds a separate random token (AUTH_SECRET), so it can't be forged.
export function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  // If not configured, don't lock anyone out (e.g. local without env set).
  if (!secret) return NextResponse.next();

  const authed = req.cookies.get("zy_auth")?.value === secret;
  const isLogin = req.nextUrl.pathname === "/login";

  if (authed) {
    return isLogin ? NextResponse.redirect(new URL("/", req.url)) : NextResponse.next();
  }
  if (isLogin) return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  // Protect pages; skip Next internals, the auth endpoint, and static files (a dot
  // in the path = an asset like .webp/.svg/.mp4 — served without the gate).
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

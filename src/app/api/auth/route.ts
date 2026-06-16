import { NextResponse } from "next/server";

// Validates the password server-side (never exposed to the client) and, on
// success, sets an httpOnly session cookie holding the AUTH_SECRET token.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const password: unknown = body?.password;
  const expected = process.env.SITE_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (expected && secret && typeof password === "string" && password === expected) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("zy_auth", secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // session cookie (no maxAge) → re-asks when the browser is fully closed
    });
    return res;
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}

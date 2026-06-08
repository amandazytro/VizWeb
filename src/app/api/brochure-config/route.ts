import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

// Persists the brochure layout edited via ?bcal=1 to public/brochure-config.json.
export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "public", "brochure-config.json");

export async function GET() {
  try {
    return NextResponse.json(JSON.parse(await readFile(FILE, "utf8")));
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(body, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}

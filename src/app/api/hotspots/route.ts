import { NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { ROOMS, type RoomKey } from "@/lib/ambientes";

// Persists the floorplan room hotspots (per bedroom count) calibrated via the
// ?cal=1 mode. GET returns the saved overrides; POST saves one plan's spots.
export const dynamic = "force-dynamic";

const FILE = path.join(process.cwd(), "public", "plantas", "ambientes", "hotspots.json");

export async function GET() {
  try {
    return NextResponse.json(JSON.parse(await readFile(FILE, "utf8")));
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const bedrooms = Number(body?.bedrooms);
  const spots: unknown = body?.spots;
  if (!bedrooms || !Array.isArray(spots)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const clean = (spots as { x: number; y: number; room: RoomKey }[])
    .filter((s) => s && typeof s.x === "number" && typeof s.y === "number" && ROOMS.includes(s.room))
    .map((s) => ({ x: s.x, y: s.y, room: s.room }));

  let map: Record<string, unknown> = {};
  try {
    map = JSON.parse(await readFile(FILE, "utf8"));
  } catch {
    /* no file yet */
  }
  map[String(bedrooms)] = clean;
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(map, null, 2), "utf8");
  return NextResponse.json({ ok: true });
}

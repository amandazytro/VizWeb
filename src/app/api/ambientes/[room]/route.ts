import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";
import { ROOMS, type RoomKey } from "@/lib/ambientes";

// Lists the image files dropped into public/plantas/ambientes/<room>/ so the
// client can pick a random one. Read fresh each call (no caching) so newly
// added images show up without a rebuild.
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ room: string }> }
) {
  const { room } = await params;
  if (!ROOMS.includes(room as RoomKey)) {
    return NextResponse.json({ images: [] }, { status: 404 });
  }
  try {
    const dir = path.join(process.cwd(), "public", "plantas", "ambientes", room);
    const files = await readdir(dir);
    const images = files
      .filter((f) => /\.(webp|avif|jpe?g|png)$/i.test(f))
      .sort()
      .map((f) => `/plantas/ambientes/${room}/${encodeURIComponent(f)}`);
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}

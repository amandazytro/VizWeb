// Floorplan room hotspots ("olhinhos"). Each plan (by bedroom count) has eye
// icons scattered over it; clicking one opens a random image from that room's
// folder under public/plantas/ambientes/<room>/ (drop images there — the
// /api/ambientes/<room> route lists them automatically).

import type { Localized } from "./i18n";

export type RoomKey = "cozinha" | "sala" | "quarto" | "banheiro";

// Allow-list used by both the client and the API route.
export const ROOMS: RoomKey[] = ["cozinha", "sala", "quarto", "banheiro"];

export const ROOM_LABEL: Record<RoomKey, Localized> = {
  cozinha: { pt: "Cozinha", en: "Kitchen" },
  sala: { pt: "Sala", en: "Living room" },
  quarto: { pt: "Quarto", en: "Bedroom" },
  banheiro: { pt: "Banheiro", en: "Bathroom" },
};

export type Hotspot = { x: number; y: number; room: RoomKey };

// Positions are % of the floorplan image (the wide render), so they ride the
// plan as it zooms. These are sensible starting points — tweak per plan.
export const PLAN_HOTSPOTS: Record<number, Hotspot[]> = {
  1: [
    { x: 30, y: 36, room: "cozinha" },
    { x: 62, y: 46, room: "sala" },
    { x: 35, y: 72, room: "quarto" },
    { x: 70, y: 26, room: "banheiro" },
  ],
  2: [
    { x: 25, y: 32, room: "cozinha" },
    { x: 54, y: 55, room: "sala" },
    { x: 75, y: 30, room: "quarto" },
    { x: 30, y: 75, room: "quarto" },
    { x: 60, y: 78, room: "banheiro" },
  ],
  3: [
    { x: 22, y: 35, room: "cozinha" },
    { x: 50, y: 60, room: "sala" },
    { x: 72, y: 28, room: "quarto" },
    { x: 78, y: 60, room: "quarto" },
    { x: 28, y: 78, room: "quarto" },
    { x: 48, y: 30, room: "banheiro" },
  ],
};

export const hotspotsFor = (bedrooms: number): Hotspot[] =>
  PLAN_HOTSPOTS[bedrooms] ?? PLAN_HOTSPOTS[3];

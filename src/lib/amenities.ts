// Áreas comuns (amenities). Static markers placed over the aerial render
// (public/areas-comuns/bg.webp). Icons are purple-square glyphs in
// public/areas-comuns/icons/<icon>.svg. marker = % of viewport (icon center).

export type Amenity = {
  key: string;
  name: string;
  icon: string; // slug of the svg in /areas-comuns/icons
  marker: { x: number; y: number }; // % — purple-square icon center
};

export const AMENITIES: Amenity[] = [
  { key: "quadra-esportiva", name: "Quadra esportiva", icon: "quadra-esportiva", marker: { x: 57.0, y: 22.5 } },
  { key: "piscina-coberta", name: "Piscina coberta", icon: "piscina-coberta", marker: { x: 32.3, y: 27.2 } },
  { key: "piscina-externa-1", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 63.1, y: 37.8 } },
  { key: "salao-festas", name: "Salão de festas", icon: "salao-festas", marker: { x: 40.9, y: 40.0 } },
  { key: "game-room", name: "Game Room", icon: "game-room", marker: { x: 21.6, y: 41.8 } },
  { key: "hall-entrada", name: "Hall de entrada", icon: "hall-entrada", marker: { x: 54.4, y: 46.6 } },
  { key: "piscina-externa-2", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 72.2, y: 52.5 } },
  { key: "academia", name: "Academia", icon: "academia", marker: { x: 19.3, y: 60.9 } },
  { key: "area-gourmet", name: "Área gourmet", icon: "area-gourmet", marker: { x: 64.8, y: 62.6 } },
  { key: "espaco-kids", name: "Espaço kids", icon: "espaco-kids", marker: { x: 30.5, y: 67.3 } },
];

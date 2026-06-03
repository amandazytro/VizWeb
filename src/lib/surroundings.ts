// Surroundings (Aproximidades) POIs. Each has a pre-rendered background with its
// route baked in (public/arredores/<key>.webp). Markers/route badge/detail are
// drawn as overlay. Photos are placeholders until real ones arrive.

export type PoiKey =
  | "restaurante"
  | "academia"
  | "supermercado"
  | "universidade"
  | "shopping";

export type Poi = {
  key: PoiKey;
  name: string;
  icon: "fork" | "dumbbell" | "cart" | "cap" | "bag";
  km: string;
  minutes: number;
  description: string;
  marker: { x: number; y: number }; // % of viewport — POI pin (constant across screens)
  badge: { x: number; y: number }; // % — time badge over the baked route
};

export const POIS: Poi[] = [
  {
    key: "supermercado",
    name: "Supermercado",
    icon: "cart",
    km: "2 km",
    minutes: 9,
    description: "Compras do dia a dia a poucos minutos do empreendimento.",
    marker: { x: 19, y: 13 },
    badge: { x: 57.7, y: 47.8 },
  },
  {
    key: "universidade",
    name: "Universidade",
    icon: "cap",
    km: "3,5 km",
    minutes: 12,
    description: "Ensino superior pertinho de casa.",
    marker: { x: 47, y: 7.5 },
    badge: { x: 57.9, y: 53.7 },
  },
  {
    key: "restaurante",
    name: "Restaurante",
    icon: "fork",
    km: "1 km",
    minutes: 4,
    description: "Local para novas experiências gastronômicas da região.",
    marker: { x: 28.5, y: 40 },
    badge: { x: 27.7, y: 61.9 },
  },
  {
    key: "academia",
    name: "Academia",
    icon: "dumbbell",
    km: "3 km",
    minutes: 5,
    description: "Estrutura completa para treino e bem-estar.",
    marker: { x: 77, y: 27.5 },
    badge: { x: 57.9, y: 54.8 },
  },
  {
    key: "shopping",
    name: "Shopping",
    icon: "bag",
    km: "4 km",
    minutes: 3,
    description: "Lojas, cinema e praça de alimentação.",
    marker: { x: 88, y: 65 },
    badge: { x: 66.3, y: 68.9 },
  },
];

export const bgFor = (key: PoiKey | "home") => `/arredores/${key}.webp`;

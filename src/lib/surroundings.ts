// Surroundings (Aproximidades) POIs. Each has a pre-rendered background with its
// route baked in (public/arredores/<key>.webp). Markers/route badge/detail are
// drawn as overlay. Photos are placeholders until real ones arrive.

export type PoiKey =
  | "restaurante"
  | "academia"
  | "supermercado"
  | "universidade"
  | "shopping";

import type { Localized } from "./i18n";

export type Poi = {
  key: PoiKey;
  name: Localized;
  icon: "fork" | "dumbbell" | "cart" | "cap" | "bag";
  km: string;
  minutes: number;
  description: Localized;
  marker: { x: number; y: number }; // % of viewport — POI pin (constant across screens)
  badge: { x: number; y: number }; // % — time badge over the baked route
};

export const POIS: Poi[] = [
  {
    key: "supermercado",
    name: { pt: "Supermercado", en: "Supermarket" },
    icon: "cart",
    km: "2 km",
    minutes: 9,
    description: {
      pt: "Compras do dia a dia a poucos minutos do empreendimento.",
      en: "Everyday shopping just minutes from the development.",
    },
    marker: { x: 18.9, y: 12.7 },
    badge: { x: 57.7, y: 35.2 },
  },
  {
    key: "universidade",
    name: { pt: "Universidade", en: "University" },
    icon: "cap",
    km: "3,5 km",
    minutes: 12,
    description: { pt: "Ensino superior pertinho de casa.", en: "Higher education right next to home." },
    marker: { x: 44.1, y: 7.3 },
    badge: { x: 57.7, y: 34.8 },
  },
  {
    key: "restaurante",
    name: { pt: "Restaurantes", en: "Restaurants" },
    icon: "fork",
    km: "1 km",
    minutes: 4,
    description: {
      pt: "Local para novas experiências gastronômicas da região.",
      en: "A spot for new dining experiences in the area.",
    },
    marker: { x: 28.8, y: 40.1 },
    badge: { x: 35.0, y: 70.3 },
  },
  {
    key: "academia",
    name: { pt: "Academia", en: "Gym" },
    icon: "dumbbell",
    km: "3 km",
    minutes: 5,
    description: { pt: "Estrutura completa para treino e bem-estar.", en: "A complete setup for training and wellness." },
    marker: { x: 75.9, y: 27.5 },
    badge: { x: 58.1, y: 46.6 },
  },
  {
    key: "shopping",
    name: { pt: "Shopping", en: "Mall" },
    icon: "bag",
    km: "4 km",
    minutes: 3,
    description: { pt: "Lojas, cinema e praça de alimentação.", en: "Shops, cinema and food court." },
    marker: { x: 87.9, y: 65.4 },
    badge: { x: 59.0, y: 68.8 },
  },
];

export const bgFor = (key: PoiKey | "home") => `/arredores/${key}.webp`;

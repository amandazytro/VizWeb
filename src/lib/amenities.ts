// Áreas comuns (amenities). Static markers placed over the aerial render
// (public/areas-comuns/bg.webp). Icons are purple-square glyphs in
// public/areas-comuns/icons/<icon>.svg. marker = % of viewport (icon center).

import type { Localized } from "./i18n";

export type AmenityGallery = {
  heading: Localized;
  description: Localized;
  images: string[]; // horizontal-scroll cards
};

export type Amenity = {
  key: string;
  name: Localized;
  icon: string; // slug of the svg in /areas-comuns/icons
  marker: { x: number; y: number }; // % — purple-square icon center
  detail?: string; // full-screen render (image or .mp4) shown when the marker is clicked
  detailRate?: number; // playback rate when detail is a video (default 1)
  gallery?: AmenityGallery; // horizontal detail/gallery panel (opened from the detail view)
  pano360?: string; // equirectangular image; clicking opens the 360 viewer directly
  intro?: string; // transition video played once before the detail
};

// Three real content sets. Amenities without their own content reuse one of
// these as a placeholder so every marker opens a detail/gallery page.
const PISCINA: { detail: string; detailRate: number; gallery: AmenityGallery } = {
  detail: "/areas-comuns/detail/piscina.mp4",
  detailRate: 0.5,
  gallery: {
    heading: { pt: "Aquecida na medida certa", en: "Warmed just right" },
    description: {
      pt: "Uma área de piscinas pensada para relaxamento e lazer, com atmosfera contemporânea, linhas limpas e sensação de tranquilidade. O espaço combina conforto, leveza e elegância, criando um ambiente convidativo e harmonioso.",
      en: "A pool area designed for relaxation and leisure, with a contemporary atmosphere, clean lines and a sense of calm. The space blends comfort, lightness and elegance, creating an inviting, harmonious environment.",
    },
    images: [
      "/areas-comuns/detail/piscina-coberta.webp",
      "/areas-comuns/detail/churras-1.webp",
      "/areas-comuns/detail/churras-2.webp",
      "/areas-comuns/detail/interior-142.webp",
    ],
  },
};

const GAMEROOM: { detail: string; gallery: AmenityGallery } = {
  detail: "/areas-comuns/detail/gameroom.mp4",
  gallery: {
    heading: { pt: "Projetada para performance", en: "Built for performance" },
    description: {
      pt: "Uma sala de jogos projetada para entretenimento e conexão, com atmosfera dinâmica, design contemporâneo e sensação de imersão. O espaço combina tecnologia, conforto e diversão, criando um ambiente versátil para reunir amigos, relaxar e viver experiências memoráveis.",
      en: "A game room designed for entertainment and connection, with a dynamic atmosphere, contemporary design and an immersive feel. The space blends technology, comfort and fun, creating a versatile setting to gather friends, unwind and live memorable experiences.",
    },
    images: [
      "/areas-comuns/detail/gameroom-01.webp",
      "/areas-comuns/detail/gameroom-02.webp",
      "/areas-comuns/detail/gameroom-03.webp",
      "/areas-comuns/detail/gameroom-04.webp",
    ],
  },
};

const ACADEMIA: { detail: string; detailRate: number; gallery: AmenityGallery } = {
  detail: "/areas-comuns/detail/academia.mp4",
  detailRate: 0.5,
  gallery: {
    heading: { pt: "Bem-estar e desempenho", en: "Wellness and performance" },
    description: {
      pt: "Ambiente moderno, equipamentos de alta qualidade e atmosfera motivadora. O espaço combina funcionalidade, conforto e energia, criando um cenário ideal para treinos produtivos e uma rotina mais saudável.",
      en: "A modern space with high-quality equipment and a motivating atmosphere. It blends functionality, comfort and energy, creating the ideal setting for productive workouts and a healthier routine.",
    },
    images: [
      "/areas-comuns/detail/academia.webp",
      "/areas-comuns/detail/academia-3.webp",
      "/areas-comuns/detail/academia-2.webp",
      "/areas-comuns/detail/academia-4.webp",
    ],
  },
};

// Marker positions are the Figma icon centres (frame "TELAS ÁREAS COMUNS",
// 1920×1080) expressed as % of the viewport, matched to /areas-comuns/bg-figma.webp.
export const AMENITIES: Amenity[] = [
  { key: "quadra-esportiva", name: { pt: "Quadra esportiva", en: "Sports court" }, icon: "quadra-esportiva", marker: { x: 57.05, y: 22.44 }, ...ACADEMIA },
  { key: "piscina-coberta", name: { pt: "Piscina coberta", en: "Indoor pool" }, icon: "piscina-coberta", marker: { x: 32.31, y: 27.25 }, ...PISCINA },
  { key: "piscina-externa-1", name: { pt: "Piscina externa", en: "Outdoor pool" }, icon: "piscina-coberta", marker: { x: 63.15, y: 37.53 }, pano360: "/areas-comuns/360/piscina-externa.webp" },
  { key: "salao-festas", name: { pt: "Salão de festas", en: "Party hall" }, icon: "salao-festas", marker: { x: 40.65, y: 39.94 }, pano360: "/areas-comuns/360/salao-festas.webp" },
  { key: "game-room", name: { pt: "Game Room", en: "Game Room" }, icon: "game-room", marker: { x: 21.64, y: 41.70 }, ...GAMEROOM },
  { key: "hall-entrada", name: { pt: "Hall de entrada", en: "Entrance hall" }, icon: "hall-entrada", marker: { x: 54.66, y: 46.51 }, pano360: "/areas-comuns/360/hall.webp" },
  { key: "piscina-externa-2", name: { pt: "Piscina externa", en: "Outdoor pool" }, icon: "piscina-coberta", marker: { x: 72.57, y: 52.35 }, pano360: "/areas-comuns/360/piscina-externa-1.webp" },
  { key: "academia", name: { pt: "Academia", en: "Gym" }, icon: "academia", marker: { x: 19.14, y: 60.87 }, ...ACADEMIA, intro: "/areas-comuns/detail/transicao-academia.mp4" },
  { key: "area-gourmet", name: { pt: "Área gourmet", en: "Gourmet area" }, icon: "area-gourmet", marker: { x: 64.76, y: 62.53 }, ...GAMEROOM },
  { key: "espaco-kids", name: { pt: "Espaço kids", en: "Kids' space" }, icon: "espaco-kids", marker: { x: 30.44, y: 67.35 }, pano360: "/areas-comuns/360/espaco-kids.webp" },
];

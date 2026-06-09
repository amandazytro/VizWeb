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
  description?: Localized; // short blurb shown in the top-left glass card while viewing
  pano360?: string; // equirectangular image; clicking opens the 360 viewer directly
  stills?: string[]; // fixed full-screen image(s); clicking opens a still viewer (swipe if >1)
  video?: string; // clicking opens the pan & scan video player
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
  { key: "piscina-coberta", name: { pt: "Piscina coberta", en: "Indoor pool" }, icon: "piscina-coberta", marker: { x: 32.3, y: 35.2 }, stills: ["/areas-comuns/stills/piscina-coberta.webp"],
    description: { pt: "Piscina coberta e aquecida, disponível o ano inteiro, com deck para descanso e um ambiente tranquilo para nadar e relaxar.", en: "Heated indoor pool, open year-round, with a lounge deck and a calm setting to swim and relax." } },
  { key: "piscina-externa-1", name: { pt: "Piscina externa", en: "Outdoor pool" }, icon: "piscina-coberta", marker: { x: 63.1, y: 42.0 }, stills: ["/areas-comuns/stills/piscina-externa.webp"],
    description: { pt: "Piscina externa com solário e área de convivência ao ar livre, perfeita para dias de sol e momentos de lazer com a família.", en: "Outdoor pool with a sun deck and open-air lounge, perfect for sunny days and family leisure." } },
  { key: "salao-festas", name: { pt: "Salão de festas", en: "Party hall" }, icon: "salao-festas", marker: { x: 37.9, y: 45.0 }, stills: ["/areas-comuns/stills/salao-festas.webp"],
    description: { pt: "Salão de festas amplo e elegante para comemorações, com copa de apoio e capacidade para até 60 convidados.", en: "Spacious, elegant party hall for celebrations, with a support pantry and room for up to 60 guests." } },
  { key: "game-room", name: { pt: "Game Room", en: "Game Room" }, icon: "game-room", marker: { x: 25.6, y: 45.8 }, ...GAMEROOM,
    description: { pt: "Sala de jogos equipada para entretenimento e convívio, com mesas, consoles e um ambiente descontraído para todas as idades.", en: "Game room equipped for entertainment and connection, with tables, consoles and a relaxed vibe for all ages." } },
  { key: "hall-entrada", name: { pt: "Hall de entrada", en: "Entrance hall" }, icon: "hall-entrada", marker: { x: 54.4, y: 56.6 }, stills: ["/areas-comuns/stills/hall-01.webp", "/areas-comuns/stills/hall-02.webp"],
    description: { pt: "Hall de entrada com pé-direito alto e acabamento sofisticado, recebendo moradores e visitantes com elegância.", en: "Entrance hall with high ceilings and refined finishes, welcoming residents and guests with elegance." } },
  { key: "academia", name: { pt: "Academia", en: "Gym" }, icon: "academia", marker: { x: 20.3, y: 65.9 }, ...ACADEMIA,
    description: { pt: "Academia completa com equipamentos de última geração e ambiente climatizado, com espaço para treino funcional. Comporta até 20 pessoas e atende todas as idades e níveis.", en: "Fully equipped gym with state-of-the-art machines and climate control, plus a functional training area. Fits up to 20 people and welcomes all ages and levels." } },
  { key: "area-gourmet", name: { pt: "Gourmet e Piscina", en: "Gourmet & Pool" }, icon: "area-gourmet", marker: { x: 64.8, y: 75.8 }, ...PISCINA,
    description: { pt: "Área gourmet integrada com churrasqueira e bancada, ideal para encontros e refeições ao ar livre com amigos.", en: "Integrated gourmet area with barbecue and counter, ideal for gatherings and open-air meals with friends." } },
  { key: "espaco-kids", name: { pt: "Espaço kids", en: "Kids' space" }, icon: "espaco-kids", marker: { x: 30.5, y: 73.3 }, stills: ["/areas-comuns/stills/espaco-kids.webp"],
    description: { pt: "Espaço kids seguro e lúdico, pensado para a diversão das crianças, com brinquedos e um ambiente colorido e acolhedor.", en: "Safe, playful kids' space designed for children's fun, with toys and a colourful, welcoming setting." } },
];

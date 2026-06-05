// Áreas comuns (amenities). Static markers placed over the aerial render
// (public/areas-comuns/bg.webp). Icons are purple-square glyphs in
// public/areas-comuns/icons/<icon>.svg. marker = % of viewport (icon center).

export type AmenityGallery = {
  heading: string;
  description: string;
  images: string[]; // horizontal-scroll cards
};

export type Amenity = {
  key: string;
  name: string;
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
    heading: "Aquecida na medida certa",
    description:
      "Uma área de piscinas pensada para relaxamento e lazer, com atmosfera contemporânea, linhas limpas e sensação de tranquilidade. O espaço combina conforto, leveza e elegância, criando um ambiente convidativo e harmonioso.",
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
    heading: "Projetada para performance",
    description:
      "Uma sala de jogos projetada para entretenimento e conexão, com atmosfera dinâmica, design contemporâneo e sensação de imersão. O espaço combina tecnologia, conforto e diversão, criando um ambiente versátil para reunir amigos, relaxar e viver experiências memoráveis.",
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
    heading: "Bem-estar e desempenho",
    description:
      "Ambiente moderno, equipamentos de alta qualidade e atmosfera motivadora. O espaço combina funcionalidade, conforto e energia, criando um cenário ideal para treinos produtivos e uma rotina mais saudável.",
    images: [
      "/areas-comuns/detail/academia.webp",
      "/areas-comuns/detail/academia-3.webp",
      "/areas-comuns/detail/academia-2.webp",
      "/areas-comuns/detail/academia-4.webp",
    ],
  },
};

export const AMENITIES: Amenity[] = [
  { key: "quadra-esportiva", name: "Quadra esportiva", icon: "quadra-esportiva", marker: { x: 57.0, y: 22.5 }, ...ACADEMIA },
  { key: "piscina-coberta", name: "Piscina coberta", icon: "piscina-coberta", marker: { x: 32.3, y: 35.2 }, ...PISCINA },
  { key: "piscina-externa-1", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 63.1, y: 42.0 }, pano360: "/areas-comuns/360/piscina-externa.webp" },
  { key: "salao-festas", name: "Salão de festas", icon: "salao-festas", marker: { x: 37.9, y: 45.0 }, pano360: "/areas-comuns/360/salao-festas.webp" },
  { key: "game-room", name: "Game Room", icon: "game-room", marker: { x: 25.6, y: 45.8 }, ...GAMEROOM },
  { key: "hall-entrada", name: "Hall de entrada", icon: "hall-entrada", marker: { x: 54.4, y: 56.6 }, pano360: "/areas-comuns/360/hall.webp" },
  { key: "piscina-externa-2", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 71.2, y: 56.7 }, pano360: "/areas-comuns/360/piscina-externa-1.webp" },
  { key: "academia", name: "Academia", icon: "academia", marker: { x: 20.3, y: 65.9 }, ...ACADEMIA, intro: "/areas-comuns/detail/transicao-academia-v2.mp4" },
  { key: "area-gourmet", name: "Área gourmet", icon: "area-gourmet", marker: { x: 64.8, y: 75.8 }, ...GAMEROOM },
  { key: "espaco-kids", name: "Espaço kids", icon: "espaco-kids", marker: { x: 30.5, y: 73.3 }, pano360: "/areas-comuns/360/espaco-kids.webp" },
];

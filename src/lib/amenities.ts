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
  detail?: string; // full-screen render shown when the marker is clicked
  gallery?: AmenityGallery; // horizontal detail/gallery panel (opened from the detail view)
};

export const AMENITIES: Amenity[] = [
  { key: "quadra-esportiva", name: "Quadra esportiva", icon: "quadra-esportiva", marker: { x: 57.0, y: 22.5 } },
  {
    key: "piscina-coberta",
    name: "Piscina coberta",
    icon: "piscina-coberta",
    marker: { x: 32.3, y: 27.2 },
    detail: "/areas-comuns/detail/piscina-coberta.webp",
    gallery: {
      heading: "Aquecida na medida certa",
      description:
        "Uma área de piscinas pensada para relaxamento e lazer, com atmosfera contemporânea, linhas limpas e sensação de tranquilidade. O espaço combina conforto, leveza e elegância, criando um ambiente convidativo e harmonioso.",
      images: [
        "/areas-comuns/detail/piscina-coberta.webp", // 1920x1078
        "/areas-comuns/detail/churras-1.webp", // 866x428 (horizontal)
        "/areas-comuns/detail/churras-2.webp", // 602x256 (horizontal)
        "/areas-comuns/detail/interior-142.webp", // 588x735 (vertical)
      ],
    },
  },
  { key: "piscina-externa-1", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 63.1, y: 37.8 } },
  { key: "salao-festas", name: "Salão de festas", icon: "salao-festas", marker: { x: 40.9, y: 40.0 } },
  {
    key: "game-room",
    name: "Game Room",
    icon: "game-room",
    marker: { x: 21.6, y: 41.8 },
    detail: "/areas-comuns/detail/gameroom-01.webp",
    gallery: {
      heading: "Projetada para performance",
      description:
        "Uma sala de jogos projetada para entretenimento e conexão, com atmosfera dinâmica, design contemporâneo e sensação de imersão. O espaço combina tecnologia, conforto e diversão, criando um ambiente versátil para reunir amigos, relaxar e viver experiências memoráveis.",
      images: [
        "/areas-comuns/detail/gameroom-01.webp", // 1394x738 → card 1
        "/areas-comuns/detail/gameroom-02.webp", // 866x428  → card 2
        "/areas-comuns/detail/gameroom-03.webp", // 602x256  → card 3
        "/areas-comuns/detail/gameroom-04.webp", // 588x735  → card 4 (vertical)
      ],
    },
  },
  { key: "hall-entrada", name: "Hall de entrada", icon: "hall-entrada", marker: { x: 54.4, y: 46.6 } },
  { key: "piscina-externa-2", name: "Piscina externa", icon: "piscina-coberta", marker: { x: 72.2, y: 52.5 } },
  {
    key: "academia",
    name: "Academia",
    icon: "academia",
    marker: { x: 19.3, y: 60.9 },
    detail: "/areas-comuns/detail/academia.webp",
    gallery: {
      heading: "Bem-estar e desempenho",
      description:
        "Ambiente moderno, equipamentos de alta qualidade e atmosfera motivadora. O espaço combina funcionalidade, conforto e energia, criando um cenário ideal para treinos produtivos e uma rotina mais saudável.",
      images: [
        "/areas-comuns/detail/academia.webp", // 1394x738 → card 1
        "/areas-comuns/detail/academia-3.webp", // 866x428  → card 2 (horizontal)
        "/areas-comuns/detail/academia-2.webp", // 602x256  → card 3
        "/areas-comuns/detail/academia-4.webp", // 588x735  → card 4 (vertical)
      ],
    },
  },
  { key: "area-gourmet", name: "Área gourmet", icon: "area-gourmet", marker: { x: 64.8, y: 62.6 } },
  { key: "espaco-kids", name: "Espaço kids", icon: "espaco-kids", marker: { x: 30.5, y: 67.3 } },
];

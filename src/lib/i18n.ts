"use client";

import { useExperience, type Lang } from "./store";

/** A string that exists in both languages (for data-driven copy). */
export type Localized = { pt: string; en: string };

/**
 * UI dictionary. Add a key to BOTH `pt` and `en`; `useT()` resolves it for the
 * current language. Data-driven copy (POIs, amenities, statuses…) is translated
 * at the source via `Localized` fields and read with `pick()`.
 */
export const T = {
  pt: {
    // nav / hud
    "nav.explore": "Explorar",
    "nav.apartments": "Apartamentos",
    "nav.solar": "Solar",
    "nav.amenities": "Áreas Comuns",
    "nav.surroundings": "Proximidades",
    "hud.showMenu": "Mostrar menu",
    "hud.hideMenu": "Ocultar menu",

    // apartamentos
    "apt.floor": "Andar",
    "apt.bedrooms": "Dormitórios",
    "apt.maxPrice": "Valor máx.",
    "apt.area": "Metragem",
    "apt.bedShort": "Dorm.",
    "apt.apShort": "Ap.",
    "apt.areaLabel": "Área",
    "apt.bathrooms": "Banheiros",
    "apt.priceLabel": "Valor R$:",
    "apt.numLabel": "Nº",
    "apt.save": "Salvar",
    "apt.expandPlan": "Expandir planta",
    "apt.lighting": "Iluminação",
    "apt.winter": "Inverno",
    "apt.back": "Voltar",
    "apt.share": "Compartilhar",
    "apt.view360": "Visualização 360°",
    "apt.unit": "Unidade",
    "apt.add": "Adicionar",
    "apt.remove": "Remover",
    "apt.planAlt": "Planta",
    "apt.planExpandedAlt": "Planta ampliada",
    "feat.insulation.title": "Isolamento de Alto Desempenho",
    "feat.insulation.desc": "Isolamento térmico e acústico de alto desempenho para mais conforto e silêncio.",
    "feat.glazing.title": "Janelas com Vidro Duplo",
    "feat.glazing.desc": "Vidros duplos que ampliam a eficiência energética e reduzem o ruído externo.",
    "feat.climate.title": "Controle Climático Inteligente",
    "feat.climate.desc": "Climatização inteligente que mantém a temperatura ideal com mais eficiência.",

    // share / summary
    "share.apartment": "Apartamento",
    "share.privateArea": "Área privativa",
    "share.status": "Status",
    "share.price": "Preço",
    "share.layout": "Tipologia",
    "share.suites": "suítes",
    "share.options": "Opcionais",
    "share.extendedLiving": "Living ampliado",
    "share.fourSuites": "4 suítes",
    "share.selectedImages": "Imagens\nselecionadas",
    "share.accessDetails": "Acesse os detalhes desta unidade",
    "share.scanQr": "Use este código para continuar a navegação, compartilhar com um consultor ou acessar mais informações sobre esta residência.",
    "share.download": "Baixar",
    "share.more": "Mais",
    "share.tower": "Torre",
    "share.removeImage": "Remover imagem",
    "share.noSaved": "Salve imagens pela experiência para montar sua brochura.",
    "ty.title": "Obrigado por conhecer o seu novo lar.",
    "ty.subtitle": "O material do empreendimento está sendo baixado automaticamente.",
    "ty.hint": "Se o download não iniciar em alguns segundos,",
    "ty.hintLink": "clique aqui.",
    "ty.schedule": "Agendar uma visita",

    // áreas comuns
    "am.space": "Espaço",
    "am.panorama": "Panorâmica",
    "am.gallery": "Galeria",
    "am.scrollToExplore": "Role para explorar",
    "am.backToImage": "Voltar à imagem",
    "am.bgAlt": "Áreas comuns do empreendimento",

    // galeria (lightbox)
    "gal.title": "GALERIA",
    "gal.images": "imagens",
    "gal.close": "Fechar",
    "gal.closeGallery": "Fechar galeria",
    "gal.closeImage": "Fechar imagem",
    "gal.all": "Todas",
    "gal.prev": "Anterior",
    "gal.next": "Próxima",
    "gal.zoomIn": "ampliar",
    "gal.zoomOut": "reduzir",
    "gal.hintPre": "← → navegar · clique para",
    "gal.hintPost": "· Esc para fechar",

    // hero (aria/alt)
    "hero.devAlt": "Empreendimento",
    "hero.towerAlt": "Torre do empreendimento",
    "hero.label360": "Empreendimento — vista 360° do edifício",
    "surround.mapAlt": "Mapa dos arredores",
  },
  en: {
    // nav / hud
    "nav.explore": "Explore",
    "nav.apartments": "Apartments",
    "nav.solar": "Solar",
    "nav.amenities": "Amenities",
    "nav.surroundings": "Surroundings",
    "hud.showMenu": "Show menu",
    "hud.hideMenu": "Hide menu",

    // apartments
    "apt.floor": "Floor",
    "apt.bedrooms": "Bedrooms",
    "apt.maxPrice": "Max. price",
    "apt.area": "Area",
    "apt.bedShort": "Bed.",
    "apt.apShort": "Apt.",
    "apt.areaLabel": "Area",
    "apt.bathrooms": "Bathrooms",
    "apt.priceLabel": "Price R$:",
    "apt.numLabel": "No.",
    "apt.save": "Save",
    "apt.expandPlan": "Expand plan",
    "apt.lighting": "Lighting",
    "apt.winter": "Winter",
    "apt.back": "Back",
    "apt.share": "Share",
    "apt.view360": "360° view",
    "apt.unit": "Unit",
    "apt.add": "Add",
    "apt.remove": "Remove",
    "apt.planAlt": "Floor plan",
    "apt.planExpandedAlt": "Enlarged floor plan",
    "feat.insulation.title": "High-Performance Insulation",
    "feat.insulation.desc": "High-performance thermal and acoustic insulation for more comfort and quiet.",
    "feat.glazing.title": "Double-Glazed Windows",
    "feat.glazing.desc": "Double glazing that boosts energy efficiency and reduces outside noise.",
    "feat.climate.title": "Smart Climate Control",
    "feat.climate.desc": "Smart climate control that keeps the ideal temperature more efficiently.",

    // share / summary
    "share.apartment": "Apartment",
    "share.privateArea": "Private area",
    "share.status": "Status",
    "share.price": "Price",
    "share.layout": "Layout",
    "share.suites": "suites",
    "share.options": "Options",
    "share.extendedLiving": "Extended living",
    "share.fourSuites": "4 suites",
    "share.selectedImages": "Selected\nimages",
    "share.accessDetails": "Access this unit's details",
    "share.scanQr": "Use this code to keep browsing, share it with a consultant, or access more information about this residence.",
    "share.download": "Download",
    "share.more": "More",
    "share.tower": "Tower",
    "share.removeImage": "Remove image",
    "share.noSaved": "Save images across the experience to build your brochure.",
    "ty.title": "Thank you for getting to know your new home.",
    "ty.subtitle": "The development's material is being downloaded automatically.",
    "ty.hint": "If the download doesn't start in a few seconds,",
    "ty.hintLink": "click here.",
    "ty.schedule": "Schedule a visit",

    // amenities
    "am.space": "Space",
    "am.panorama": "Panorama",
    "am.gallery": "Gallery",
    "am.scrollToExplore": "Scroll to explore",
    "am.backToImage": "Back to image",
    "am.bgAlt": "Development amenities",

    // gallery (lightbox)
    "gal.title": "GALLERY",
    "gal.images": "images",
    "gal.close": "Close",
    "gal.closeGallery": "Close gallery",
    "gal.closeImage": "Close image",
    "gal.all": "All",
    "gal.prev": "Previous",
    "gal.next": "Next",
    "gal.zoomIn": "zoom in",
    "gal.zoomOut": "zoom out",
    "gal.hintPre": "← → navigate · click to",
    "gal.hintPost": "· Esc to close",

    // hero (aria/alt)
    "hero.devAlt": "Development",
    "hero.towerAlt": "Development tower",
    "hero.label360": "Development — 360° view of the building",
    "surround.mapAlt": "Surroundings map",
  },
} as const;

export type TKey = keyof (typeof T)["pt"];

/** Returns a `t(key)` translator bound to the active language. */
export function useT() {
  const lang = useExperience((s) => s.lang);
  return (key: TKey): string => T[lang][key];
}

/** Read the active language directly (for `pick`-ing data-driven copy). */
export function useLang(): Lang {
  return useExperience((s) => s.lang);
}

/** Pick the right value from a `{ pt, en }` pair (for data-driven copy). */
export function pick<V>(lang: Lang, pair: { pt: V; en: V }): V {
  return pair[lang];
}

# Zytro / The Vertical — PRD (estado atual)

> Documento vivo do que **está construído** no demo. Difere do PRD original
> (`Immersive Real Estate Experience Platform.pdf` + `.planning/`), que descrevia
> o produto completo com backend. Esta versão reflete o **demo frontend** em
> desenvolvimento.

**Última atualização:** 2026-06-03

---

## 1. Visão

Microsite imersivo e cinematográfico para um único empreendimento de alto padrão
("The Vertical"). O visitante percorre um vídeo do prédio controlado por
mouse/scroll e explora as unidades disponíveis sobre a própria imagem. Ferramenta
de marketing/venda; foco em impressionar e gerar interesse.

**Core:** percorrer o vídeo do empreendimento de forma fluida e explorar
apartamentos disponíveis com filtros — tudo numa única tela imersiva (sem scroll
de página).

---

## 2. Escopo deste demo

- **Somente frontend.** Sem backend, sem auth, sem banco. Dados de apartamentos,
  galeria e plantas são **mock/local**.
- **Tela única fixa** (sem scroll vertical de página). O "scroll" controla o vídeo.
- Pilotado por uma imagem de referência de UI ("The Vertical").

Fora de escopo (vs PRD original): Supabase/R2/admin, leads, multi-tenant SaaS,
analytics, mood day/night (substituído pelo vídeo), 360 tour separado.

---

## 3. Stack

| Camada | Tech |
|--------|------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Estilo | Tailwind v4 |
| Animação/scroll | GSAP + @gsap/react + Lenis (scroll-scrub), rAF easing |
| Estado | Zustand (`src/lib/store.ts`) |
| Fonte | Red Hat Display / Red Hat Mono (medium 500) |
| Mídia | sequência de frames webp em `<canvas>`; imagens webp |
| Dev | `next dev --turbopack` · Build prod: webpack |

Dependências runtime: `next, react, react-dom, gsap, @gsap/react, lenis, zustand`.

---

## 4. Funcionalidades implementadas

### 4.1 Hero — Explorar (scroll-scrub de vídeo)
- Vídeo do cliente (`Refs/0001-1495.mp4`, 1920×1080, 1495 frames) extraído para
  **299 frames webp** (`public/frames/explore/`, fps 6, 1280w).
- Renderizado num `<canvas>` cover-fit; **scroll do mouse** percorre os frames
  (fwd/back) com **easing rAF** suave.
- **Click-drag**: segurar e arrastar → direita avança, esquerda retrocede.
  Cursor vira **seta direcional** (←/→) durante o arraste.
- Bússola de **orientação** no topo (ribbon NO·N·NE com ticks) ligada ao frame
  (órbita ≈ 360°).
- Reduced-motion → frame estático.
- `src/components/hero-sequence.tsx`.

### 4.2 HUD / Dock (`src/components/hud.tsx`)
- Marca **THE VERTICAL** (topo-esq), **bússola** (topo-centro), **Galeria** (topo-dir).
- **Dock inferior** (glass claro) com 4 itens + ícones custom (SVGs de `Refs/icones`):
  **Explorar · Apartamentos · Áreas comuns · Aproximidades**. Default Explorar.
- **Chevron** delicado pra ocultar/mostrar o dock (abaixa só um pedaço; setinha
  fica embaixo quando visível, em cima quando oculto).
- Áreas comuns / Aproximidades = **stubs** (sem conteúdo ainda).

### 4.3 Apartamentos (`src/components/apartments/apartments-overlay.tsx`)
- Ao abrir: hero **anima até o frame 0** e trava o scrub; só então a UI faz fade-in.
- **Hotspots por unidade** pintados sobre a torre (homografia 2 faces / perspectiva),
  coloridos por status; hover destaca; click abre detalhe.
- **Filtros** (cards glass separados):
  - **Andar**, **Valor**, **Metragem** = sliders **duplos (min–max)**.
  - **Dormitórios** = chips 1/2/3 (mesma linha).
- **Legenda de status** (centro-dir): Vendidos (vermelho) · Disponíveis (roxo) ·
  Reservados (amarelo). Acesos por padrão; click ativa/filtra (acende, não cresce).
- **Painel de detalhes (esquerda)**: glass liquid (borda desfocada/frosted), campos
  Nº/Área/Dormitórios/Banheiros/Valor R$ + **planta humanizada transparente** que
  vaza a borda; ações flutuantes: voltar, expandir (lightbox), salvar.
- Dados mock: `src/lib/apartments.ts` (30 unidades, 2 colunas/torre, determinístico).
- Plantas: `src/lib/plantas.ts` (4 webp transparentes, distribuídas por unidade).

### 4.4 Galeria (`src/components/gallery/gallery-overlay.tsx`)
- Abre pela **Galeria** (topo-dir). Tabs por categoria (Todas/Exterior/Interiores/
  Áreas Comuns/Detalhes/Vistas/Arquitetura) + grid + **lightbox** (prev/next, zoom,
  teclado). Imagens mock = frames placeholder. `src/lib/gallery.ts`.

### 4.5 i18n
- Site todo em **pt-BR**.

---

## 5. Estrutura de arquivos

```
src/
  app/{layout,page,globals.css}        # shell, fonte Red Hat, viewport fixo
  components/
    hero-sequence.tsx                  # scrub de vídeo (canvas + wheel/drag)
    hud.tsx                            # marca, bússola, dock, galeria, chevron
    apartments/apartments-overlay.tsx  # hotspots, filtros, legenda, detalhe
    gallery/gallery-overlay.tsx        # galeria + lightbox
    smooth-scroll.tsx                  # (legado Lenis, não usado no hero atual)
  lib/{store,apartments,plantas,gallery,frames}.ts
public/
  frames/explore/*.webp (299)          # frames do vídeo
  hero/{diurno,noturno}.webp           # (legado do mood day/night)
  plantas/*.webp (4)                   # plantas transparentes
```

---

## 6. Pendências / próximos passos

- **Áreas comuns** e **Aproximidades**: definir conteúdo (galeria de áreas comuns? mapa de POIs?).
- **Calibração dos hotspots** vs vídeo em órbita: hoje calibrados pra um frame
  frontal; em outros ângulos desalinham (hero trava no frame 0 ao abrir, então ok).
- **Performance**: 299 frames ≈ 19MB de preload. Otimizar (menos frames/res, AVIF, ou stream).
- **Mobile/responsivo**: layout pensado p/ desktop; falta polish < 768px.
- **Backend (futuro)**: trocar mock por Supabase/R2 conforme PRD original (`.planning/`).
- **Dev cache**: `.next` (webpack) corrompia com HMR; mitigado com `--turbopack`.

---

## 7. Como rodar

```bash
npm install
npm run dev        # http://localhost:3001 (turbopack)
npm run build      # build de produção (webpack)
# regenerar frames do vídeo: node scripts/gen-frames.mjs (hero placeholder)
```

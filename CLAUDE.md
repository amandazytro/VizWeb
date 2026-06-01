<!-- GSD:project-start source:PROJECT.md -->

## Project

**Zytro — Immersive Real Estate Experience Platform**

Zytro is a premium web platform that presents a single high-end real estate development through a cinematic, interactive experience. Instead of a traditional website, visitors explore the building via scroll-controlled video, dynamic lighting moods, a 360° orbital tour, and a visual availability map of units. It is a commercial and marketing tool for the developer (incorporadora), with content managed through an admin panel.

This first build targets one real pilot development (a paying/waiting client), not a multi-tenant SaaS. The SaaS direction is a deliberate future milestone.

**Core Value:** A visitor scrolls and the building comes alive cinematically — smooth, controlled, 60fps. If the immersive scroll-driven experience does not feel premium and fluid, nothing else matters.

### Constraints

- **Tech stack**: Next.js 15 + React 19 + TypeScript, Tailwind + Shadcn UI (CVA, tailwind-merge) — fixed by spec
- **Animation**: GSAP + ScrollTrigger + Lenis + Motion for scroll-driven scrubbing — the core technical risk; must hit 60fps
- **Video**: HLS.js / Video.js / native HTML5 video; Next Image + Sharp for stills
- **State/data**: Zustand (UI state), TanStack Query (server state), React Hook Form + Zod (forms/validation)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime) as primary; Cloudflare R2 / AWS S3 for video assets
- **Maps**: Google Maps Platform / Google Earth Studio assets / Mapbox for the Location module
- **Hosting**: Vercel (app) + Supabase Cloud + Cloudflare — video bandwidth/storage cost is a real concern
- **Performance**: 60fps desktop, 30fps mobile min, LCP < 2.5s, Lighthouse 90+ — hard targets from spec
- **Timeline**: pilot client waiting — favor a fast navigable demo

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | `15.x` (App Router) | App framework, SSR/RSC, routing, image optimization | Spec-fixed. Mature App Router + React 19 support. Stay on **15.x**, not 16, for ecosystem stability (see note). |
| React | `19.x` | UI runtime | Spec-fixed. All listed libs now ship React 19 support. Latest stable is `19.2.x`. |
| TypeScript | `5.6+` | Type safety | Required by React 19 / Next 15 types. Use `5.6` or newer. |
| Tailwind CSS | `4.x` | Styling engine | Use **v4** (CSS-first `@theme`, faster engine). shadcn fully supports it. Latest `4.3.x`. |
| shadcn/ui | CLI `canary` → stable | Component primitives (Radix-based) | Spec-fixed. Use `npx shadcn@canary init` for Tailwind v4 + React 19 projects; components ship `data-slot`, forwardRefs removed. |
| GSAP | `3.15.x` | Animation core + ScrollTrigger | **Now 100% free incl. all plugins** (Webflow acquisition, May 2025). This is the engine for scroll scrubbing. Latest `3.15.0`. |
| @gsap/react | `2.1.x` | `useGSAP()` hook | **Mandatory** in React 19 / Next 15 — handles SSR-safe init + automatic cleanup (wraps `gsap.context()`). Do not hand-roll `useLayoutEffect`. |
| Lenis | `1.3.x` | Smooth scroll / inertia | Spec-fixed. Use the `lenis` package + `lenis/react` import (NOT the retired `@studio-freight/*`). Latest `1.3.23`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | `5.x` | Client UI state (mood selector, drawer open, filters) | Lightweight global UI state. Latest `5.0.x`. React 19 compatible. |
| @tanstack/react-query | `5.x` | Server state (apartments, settings, leads) | Fetch/cache Supabase data. Latest `5.100.x`. |
| react-hook-form | `7.x` | Forms (contact, admin CRUD, filters) | Latest `7.77.x`. Performant uncontrolled forms. |
| zod | `4.x` | Schema validation | Latest `4.4.x`. See compatibility note — pin `@hookform/resolvers` `5.x`. |
| @hookform/resolvers | `5.x` | RHF ↔ Zod bridge | **Must be `5.x`** — older versions break with Zod 4. `5.x` auto-detects Zod v3/v4. |
| hls.js | `1.6.x` | Adaptive HLS playback (360° tour, full-length video) | Use for the **360° orbital tour** and any streamed long-form video. Latest `1.6.16`. |
| video.js | — | (Optional) full player chrome | **Skip unless you need a full player UI.** For the 360 tour, native `<video>` + hls.js + custom controls is lighter. Only add video.js if you want batteries-included Play/Pause/Fullscreen/quality UI fast. |
| sharp | `0.34.x` | Image processing (Next Image, frame pipeline) | Powers `next/image` optimization + your build-time frame/AVIF generation. Latest `0.34.5`. |
| motion | `12.x` | (Was Framer Motion) micro-interactions, drawers, page transitions | Use for component-level UI motion (lightbox, drawer). **Do NOT use it for the scroll-scrub engine** — GSAP/ScrollTrigger owns that. Latest `12.40.x`. |
| mapbox-gl | `3.x` | Location module map | Recommended over raw Google Maps JS for custom-styled, premium-feeling maps. Latest `3.24.x`. See alternatives. |
| @supabase/supabase-js | `2.x` | DB / Auth / Storage / Realtime client | Latest `2.106.x`. Use `@supabase/ssr` for Next 15 App Router cookie/session handling. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| FFmpeg | Asset pipeline: frame extraction, AVIF/WebP sequences, keyframe-dense re-encode | **Core to this project.** Used offline to turn source renders into the scroll-scrub asset (image sequence and/or GOP-tuned HLS). |
| `@supabase/ssr` | Next 15 App Router auth | Replaces deprecated auth-helpers. Required for admin session cookies. |
| Supabase CLI | Migrations, types, local dev | Generate TS types from schema for end-to-end type safety. |
| ESLint + Prettier | Lint/format | Use `eslint-config-next`. |

## The Decision That Matters: Scroll-Scrubbed Video at 60fps

### Why NOT frame-seek on a `<video>` element for the scrub

- **Decoder seek cost.** Seeking to a non-keyframe makes the decoder walk back to the previous I-frame and re-decode forward. With normal GOP sizes this stutters badly, especially scrubbing **backwards** (scroll up). (HIGH confidence — well-documented decoder behavior.)
- **Browser inconsistency.** Chrome/Safari tolerate ~1 keyframe per 5 frames; Firefox needs ~1 per 2 frames or it visibly janks. Achieving smoothness requires a keyframe-dense re-encode, which inflates file size and partly defeats the point.
- **`requestVideoFrameCallback`** improves *measuring* when a frame is painted but does not make seeking itself fast.

### Why image sequence on `<canvas>` IS the premium approach

- Preload a numbered frame sequence (`0001.avif … NNNN.avif`), draw the scroll-mapped frame to a `<canvas>` inside a pinned ScrollTrigger.
- Painting a decoded bitmap is cheap and **identical cost forwards and backwards** → smooth 60fps both directions.
- Use **AVIF or WebP** frames (AVIF preferred; ~80–90% smaller than PNG) and `createImageBitmap()` for off-main-thread decode.
- GSAP ships an official helper (`imageSequenceScrub`) for exactly this.
- Target **~24–30fps source** for the sequence (not 60fps frames — 60fps sequences "perform horrendously" and rarely look better). The 60fps target applies to the *scroll/paint loop*, not the number of distinct frames.
- Keep the hero a **short, bounded clip** (e.g. 8–15s ⇒ ~200–450 frames). At ~15–40KB/AVIF frame that is a few MB — load with a progress gate and a poster fallback.
- For mood switching (day/night, same trajectory): preload **two sequences** of the same frame indices and cross-fade canvases, or composite, so the camera path is identical and only lighting changes.

### Hybrid rule

| Surface | Technique | Reason |
|---------|-----------|--------|
| **Hero scrub** (bounded, must be flawless both directions) | Image sequence → `<canvas>` (AVIF, preloaded) | Decode-once, paint-cheap, symmetric scrub. |
| **Mood switch** | 2× aligned image sequences, cross-fade | Identical camera path, only lighting differs. |
| **360° orbital tour** (linear playback, Play/Pause/Fullscreen, longer) | `<video>` + **hls.js** | It plays forward, not scrubbed — adaptive HLS streaming is the right tool, avoids preloading thousands of frames. |
| **Long / future cinematic** where frame count is impractical | HLS `<video>` with keyframe-dense (`-g`) re-encode, scrub as fallback | Avoids unbounded memory; accept reduced scrub fidelity. |

## GSAP + ScrollTrigger + Lenis on Next 15 / React 19 — Integration Notes

## Storage: Supabase Storage vs Cloudflare R2 for Video

| Factor | Cloudflare R2 | Supabase Storage |
|--------|---------------|------------------|
| Egress | **$0** (zero) | ~$0.09/GB over plan allowance |
| Storage | ~$0.015/GB/mo | ~$0.021/GB/mo over allowance |
| Best for | **Large video, HLS segments, high-view-count delivery** | User/admin uploads, images, tight Postgres/RLS integration |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Image sequence (`<canvas>`) for hero scrub | Frame-seek `<video>` (`currentTime`) | Only as a mobile/low-end fallback, or if the hero clip is long enough that a frame sequence's memory is impractical — accept reduced fidelity. |
| hls.js + native `<video>` + custom controls (360 tour) | video.js | When you want full player chrome (controls, quality menu, plugins) out of the box and don't want to build it. Adds bundle weight. |
| Mapbox GL JS | Google Maps Platform | If you must use Google POI data / Street View, or the team already has Google Maps billing. Mapbox wins on premium custom styling. |
| Cloudflare R2 (video) | AWS S3 + CloudFront | If already on AWS or needing S3-specific tooling. R2 wins decisively on egress cost for video. |
| Supabase Auth (admin only) | Clerk / Auth.js | Overkill here — admin-only auth is trivial in Supabase, which you already run for DB. |
| Zod 4 | Valibot | If bundle size is critical. Zod 4 is fine here and already in the spec. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@studio-freight/lenis` / `@studio-freight/react-lenis` | **Retired** after Studio Freight → Darkroom Engineering rename | `lenis` package + `lenis/react` |
| Frame-seeking `<video>` for the premium hero scrub | Decoder re-decodes from keyframe on seek → stutters, worst scrubbing backwards, Firefox janks | Preloaded AVIF image sequence on `<canvas>` |
| 60fps frame sequences | "Performance horrendous"; huge memory; no visual gain | 24–30fps source frames, 60fps paint loop |
| PNG frames | Massive payload | AVIF (preferred) or WebP — up to ~90% smaller |
| Hand-rolled `useLayoutEffect` for GSAP in Next 15 | Hydration warnings, leaked ScrollTriggers, layout-shift bugs | `useGSAP()` from `@gsap/react` |
| `@hookform/resolvers` < 5 with Zod 4 | Type + runtime breakage (`expected a Zod schema`) | `@hookform/resolvers@5.x` (auto-detects Zod v3/v4) |
| Two RAF loops (Lenis `autoRaf` + GSAP ticker) | Competing loops → jitter | `autoRaf:false`, drive Lenis from `gsap.ticker` |
| `motion`/Framer Motion for the scroll-scrub engine | Not built for frame-precise scroll scrubbing | GSAP + ScrollTrigger for scrub; motion only for UI micro-interactions |
| Supabase Storage as primary video host | Egress costs balloon at view scale | Cloudflare R2 (zero egress) for video/HLS |
| Old Supabase `auth-helpers-nextjs` | Deprecated for App Router | `@supabase/ssr` |

## Stack Patterns by Variant

- Prefer HLS `<video>` with a keyframe-dense re-encode (`ffmpeg -g <small>`) over a giant frame sequence.
- Because preloading thousands of AVIF frames blows memory/bandwidth; accept slightly reduced scrub smoothness as the tradeoff.
- Add `video.js` (+ `@types/video.js`) instead of building custom controls on native `<video>`.
- Because it provides Play/Pause/Replay/Fullscreen UI out of the box; revisit later if bundle size matters.
- Render both moods from the identical camera path/trajectory before extracting sequences.
- Because cross-fading misaligned sequences breaks the "only lighting changes" illusion.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| next@15 | react@19, react-dom@19 | Use App Router; `@supabase/ssr` for sessions. |
| @gsap/react@2.1 | gsap@3.15, react@19 | `useGSAP()` is the SSR-safe entry point. |
| lenis@1.3 | gsap@3.15, react@19, next@15 | Use `lenis/react`; drive RAF from GSAP ticker (`autoRaf:false`). |
| zod@4 | @hookform/resolvers@5, react-hook-form@7.77 | Resolver **must be v5** for Zod 4. |
| tailwindcss@4 | shadcn (canary), react@19 | Init via `npx shadcn@canary init`; CSS-first `@theme`. |
| @supabase/supabase-js@2 | @supabase/ssr, next@15 | Server components/route handlers via `@supabase/ssr`. |

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->

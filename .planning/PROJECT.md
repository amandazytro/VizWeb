# Zytro — Immersive Real Estate Experience Platform

## What This Is

Zytro is a premium web platform that presents a single high-end real estate development through a cinematic, interactive experience. Instead of a traditional website, visitors explore the building via scroll-controlled video, dynamic lighting moods, a 360° orbital tour, and a visual availability map of units. It is a commercial and marketing tool for the developer (incorporadora), with content managed through an admin panel.

This first build targets one real pilot development (a paying/waiting client), not a multi-tenant SaaS. The SaaS direction is a deliberate future milestone.

## Core Value

A visitor scrolls and the building comes alive cinematically — smooth, controlled, 60fps. If the immersive scroll-driven experience does not feel premium and fluid, nothing else matters.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hero experience: one scroll-scrubbed video of the building, no autoplay, user controls the timeline (0%→100% = first→last frame)
- [ ] Mood controller: switch building lighting between at least 2 states (e.g. day / night), same camera/trajectory, only lighting changes
- [ ] 360° tour: "Explore Building" button triggers an orbital video with Play / Pause / Replay / Fullscreen controls
- [ ] Apartments availability: frozen building frame with clickable unit overlay; status Available / Reserved / Sold / Highlight; hover info + detail drawer
- [ ] Availability filters: price range, area, bedrooms, suites, floor range, orientation, view type
- [ ] Gallery: categorized renders/images with fullscreen, zoom, lightbox
- [ ] Location: map of surroundings with points of interest and category filters
- [ ] Contact form: capture qualified leads (no visitor login)
- [ ] Admin panel: manage the project (settings, media upload, apartments CRUD) — admin-only auth
- [ ] Performance: 60fps desktop / 30fps mobile min, LCP < 2.5s, Lighthouse 90+

### Out of Scope

- Multi-tenant SaaS / multiple developers — deferred to a future milestone; first build is single-project to ship the pilot fast
- Visitor accounts (Buyer / Investor / Broker login, favorites, history) — not needed for lead-gen MVP; only admin authenticates
- Full 6-mood set (sunrise→night) and full interiors set — MVP proves the mechanism with a reduced mood set; remaining moods/interiors wire in once real assets exist
- Producing the cinematic/360 video assets — out of scope for this build; MVP uses stock 360 footage as placeholder until the client delivers real renders
- AI sales assistant, SaleVerse integration, floorplan explorer, unit interior viewer — listed as future features in the spec

## Context

- **Source spec:** `Immersive Real Estate Experience Platform.pdf` (v1.0) — defines 5 modules (Experience, Apartments Availability, Interiors, Gallery, Location) + Admin Panel, personas (Buyer / Investor / Broker), business goals (qualified leads, conversion, differentiation), and a Phase-1 MVP scope.
- **Assets gap:** No real cinematic/360 videos yet. The hardest technical surface (scroll-scrubbed video + mood switching + 360 orbital) will be built against **stock 360 footage** so the real pipeline (HLS, scroll-driven frame seek) is exercised and assets can be swapped without rework.
- **MVP intent:** Prove the *mechanism* — one scroll-scrubbed hero video, one 360 tour, mood controller with 2 states — then expand to the full mood/interiors set when assets arrive.
- **Client pressure:** A pilot developer is waiting. Priority is a navigable, impressive demo quickly over exhaustive feature coverage.

## Constraints

- **Tech stack**: Next.js 15 + React 19 + TypeScript, Tailwind + Shadcn UI (CVA, tailwind-merge) — fixed by spec
- **Animation**: GSAP + ScrollTrigger + Lenis + Motion for scroll-driven scrubbing — the core technical risk; must hit 60fps
- **Video**: HLS.js / Video.js / native HTML5 video; Next Image + Sharp for stills
- **State/data**: Zustand (UI state), TanStack Query (server state), React Hook Form + Zod (forms/validation)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime) as primary; Cloudflare R2 / AWS S3 for video assets
- **Maps**: Google Maps Platform / Google Earth Studio assets / Mapbox for the Location module
- **Hosting**: Vercel (app) + Supabase Cloud + Cloudflare — video bandwidth/storage cost is a real concern
- **Performance**: 60fps desktop, 30fps mobile min, LCP < 2.5s, Lighthouse 90+ — hard targets from spec
- **Timeline**: pilot client waiting — favor a fast navigable demo

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single-project, not SaaS, for v1 | Ship the pilot fast; tenancy/billing would balloon scope | — Pending |
| Admin-only auth; visitors never log in | Lead-gen product; accounts add scope with no MVP value | — Pending |
| Stock 360 footage as placeholder | Real assets don't exist yet; exercise the real video pipeline so swap is trivial | — Pending |
| MVP proves mechanism, not full mood/interior set | Hardest risk is the scroll-scrub engine, not asset count | — Pending |
| Supabase as primary backend, R2/S3 for video | Spec-mandated; Supabase covers DB/auth/storage/edge, object storage for heavy video | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-01 after initialization*

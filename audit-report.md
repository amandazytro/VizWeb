# Code Audit Report — Zytro / The Vertical
_Generated 2026-06-04 · Read-only audit · No files were modified_

## Stack detected
- **Next.js 15.5.19** (App Router) + **React 19.1** + **TypeScript 5**
- **Tailwind v4**, **Zustand 5** (UI state), **three 0.184** (360 viewer), **qrcode.react 4.2** (share QR)
- Build/asset pipeline (dev): sharp, ffmpeg-static, ffprobe-static
- **Scanned:** all of `src/` (19 files, ~2916 LOC), `package.json`, public asset dimensions, `npm audit`.
- **N/A:** no backend, API routes, auth, DB, `.env`, or `process.env` in `src` → Security/Secrets/Auth/Authorization modules have nothing to audit. Frontend-only demo with mock data.

## Summary
Clean codebase: **tsc 0 errors, eslint 0 warnings**, no `any`, no `console.*`, no `@ts-ignore`, no secrets. Shared components (Dock, MarkerPill) keep it DRY. **0 CRITICAL.** The one thing that genuinely bites: the **360 panoramas are 8000×4000**, which exceeds the WebGL max-texture-size on most phones — the 360 viewer will likely render blank on mobile, and the product explicitly targets mobile. Plus one dead screen (GalleryOverlay) and some demo placeholders. Counts: **0 CRITICAL · 1 HIGH · 1 MEDIUM · 5 LOW**.

## Priority table
| # | Severity | Module | Location | Issue |
|---|----------|--------|----------|-------|
| 1 | HIGH | Performance / correctness | `src/components/Panorama360.tsx` + `public/**/360/*.webp` | 8000×4000 equirectangular textures exceed mobile GL_MAX_TEXTURE_SIZE (≈4096) → 360 blank on most phones; ~128MB GPU each |
| 2 | MEDIUM | Dead code | `src/components/gallery/gallery-overlay.tsx`, `src/lib/gallery.ts`, `src/app/page.tsx:18` | `panel="gallery"` is never triggered → GalleryOverlay unreachable |
| 3 | LOW | Quality | `src/components/apartments/share-screen.tsx` | Placeholder assets (building = explore frame, selected images reused) |
| 4 | LOW | Quality | `src/lib/amenities.ts` | 7 amenities reuse 3 real galleries as placeholder content |
| 5 | LOW | Frontend | `src/components/panel-url-sync.tsx` | `"gallery"` kept in restorable PANELS though unreachable |
| 6 | LOW | Performance | `src/components/hero-sequence.tsx:60` | 299 hero frames eagerly decoded (~66MB) |
| 7 | LOW | Dependencies | `package-lock` (transitive) | `postcss` moderate advisory inside Next’s bundled copy |

## Findings (detailed)

### [#1] HIGH — 360 panoramas are 8000×4000 (too large for mobile GPUs)
- **Location:** `src/components/Panorama360.tsx` (TextureLoader → sphere); assets `public/areas-comuns/360/*.webp`, `public/plantas/360/*.webp` (all 8000×4000).
- **What:** The viewer uploads each equirectangular image to a WebGL texture at native resolution. 8000px exceeds `GL_MAX_TEXTURE_SIZE` on most mobile GPUs (commonly 4096) and some laptops → the texture silently fails to upload and the sphere renders black/blank. Even where it works, 8000×4000 RGBA ≈ ~128MB GPU memory per panorama.
- **Why it matters:** The 360 tour is a core feature and the spec targets mobile (30fps min). On phones it will frequently show nothing. Desktop mostly survives (max 16384) but pays the memory cost.
- **Suggested fix:** Re-export the panoramas at **4096×2048** (still 2:1, plenty for a sphere); optionally a 2048×1024 mobile tier. Re-encode example:
  ```bash
  ffmpeg -i in.png -vf scale=4096:2048 -c:v libwebp -q:v 82 out.webp
  ```
  Optionally clamp in code: `renderer.capabilities.maxTextureSize` to pick a tier.
- **Confidence:** confirmed (asset dims verified 8000×4000); the mobile-failure threshold is device-dependent but 4096 is the common mobile cap.

### [#2] MEDIUM — GalleryOverlay is unreachable (dead screen)
- **Location:** rendered at `src/app/page.tsx:18`; opens only when `panel==="gallery"` (`gallery-overlay.tsx:14`), but **nothing calls `openPanel("gallery")`** anywhere in `src`. `src/lib/gallery.ts` feeds only this component.
- **What:** The categorized gallery panel (and its mock data) can't be opened through the UI — the old HUD "Galeria" trigger was removed; the amenities "Galeria" uses local state, not this panel.
- **Why it matters:** Dead UI + data carried in the bundle; misleads future devs into thinking the gallery screen is wired.
- **Suggested fix:** Either delete `gallery-overlay.tsx` + `lib/gallery.ts` (and the `page.tsx` render), or add a real entry point if the screen is still wanted. If kept intentionally for `?view=gallery` deep links, add a comment saying so.
- **Confidence:** confirmed (no `openPanel("gallery")` in src).

### [#3] LOW — Share screen uses placeholder media
- **Location:** `src/components/apartments/share-screen.tsx` (`SEL` array; building `src="/frames/explore/0156.webp"`).
- **What:** "Overview" tower and "Imagens selecionadas" reuse explore/amenity assets instead of real unit renders.
- **Why it matters:** Visual only; fine for demo, swap before client delivery.
- **Suggested fix:** Replace with real per-unit assets when available.
- **Confidence:** confirmed (intentional placeholders).

### [#4] LOW — Most amenities reuse 3 galleries as placeholders
- **Location:** `src/lib/amenities.ts` (`...PISCINA / ...ACADEMIA / ...GAMEROOM` spreads on 7 markers).
- **What:** Quadra, hall, área gourmet, etc. show another amenity’s images/text (the vertical title is correct).
- **Why it matters:** Placeholder content; expected per the build order.
- **Suggested fix:** Add real `detail`/`gallery`/`pano360` per amenity as assets arrive.
- **Confidence:** confirmed.

### [#5] LOW — `"gallery"` left in restorable URL panels
- **Location:** `src/components/panel-url-sync.tsx` (`PANELS` includes `"gallery"`).
- **What:** `?view=gallery` would restore an otherwise-unreachable panel. Harmless today; becomes moot if #2 is removed.
- **Suggested fix:** Drop `"gallery"` from the list (or remove with #2).
- **Confidence:** confirmed.

### [#6] LOW — Hero preloads all 299 frames eagerly
- **Location:** `src/components/hero-sequence.tsx:60` (bounded-concurrency loader, START_AT gate).
- **What:** Decodes ~299 webp (~66MB) on mount. Documented image-sequence tradeoff; already chunked + starts early.
- **Why it matters:** Memory on low-end mobile; not a defect.
- **Suggested fix:** Optional mobile tier / lower frame count; leave as-is otherwise.
- **Confidence:** confirmed behavior.

### [#7] LOW — postcss advisory (transitive via Next)
- **Location:** `node_modules/next/node_modules/postcss` (bundled).
- **What:** `npm audit` flags a moderate postcss XSS-in-stringify advisory; only `npm audit fix --force` (downgrades Next to 9.x — breaking) clears it.
- **Why it matters:** Not in this app’s code path (we don’t stringify untrusted CSS); resolves when Next bumps its bundled postcss.
- **Suggested fix:** Leave it; don’t force-downgrade Next.
- **Confidence:** confirmed.

## What was checked but looked OK
- **Build/types/lint:** `tsc --noEmit` 0 errors, `eslint src` 0 warnings.
- **TypeScript:** no `any`, no `as any`, no `@ts-ignore/expect-error`.
- **Secrets/config:** none; `.mcp.json` only a public URL; `.gitignore` covers `.env*`/`.next`/`.dev.log`.
- **State:** `store.ts` has no dead fields (earlier `dayNight`/`uiHidden`/`moodToTime` already removed); `navTick`/`dockMinimized`/`aptReady`/`heading` all used.
- **WebGL hygiene:** `Panorama360` disposes texture/material/geometry/renderer + `forceContextLoss()` and cancels rAF on unmount — no leak.
- **a11y:** apartment hotspots keyboard-operable; 360/markers have `aria-label`.
- **DRY:** Dock and MarkerPill are shared between HUD/ShareScreen and the two map overlays.
- **Raw `<img>`:** only for inline SVG icons (marker-pill, plantas/ver icons) — `next/image` rightly reserved for raster bg/gallery/detail.

## Suggested next steps
1. **Fix #1 first** — re-export every 360 webp to 4096×2048 (and/or clamp by `maxTextureSize`). It’s the only thing that breaks a real feature on the target (mobile).
2. **Decide #2** — delete the dead GalleryOverlay + gallery.ts (and #5), or wire a real entry point.
3. Swap placeholders (#3, #4) as real assets arrive.
4. Leave #6/#7 unless profiling/security policy demands otherwise.

---
**Reminder:** read-only audit — **nothing was changed.** Tell me which findings to address (e.g. "fix #1" to downscale the panoramas, or "apply #2") and I’ll do it.

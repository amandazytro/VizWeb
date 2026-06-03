# Code Audit Report — Zytro / The Vertical
_Generated 2026-06-03 · Read-only audit · No files were modified_

## Stack detected
- **Framework:** Next.js 15.5.19 (App Router) + React 19.1.0 + TypeScript 5
- **Styling:** Tailwind CSS v4 (CSS-first `@theme`)
- **State:** Zustand 5
- **Animation deps present:** GSAP 3.15, @gsap/react 2.1, Lenis 1.3
- **Build/asset pipeline (devDeps):** sharp, ffmpeg-static, ffprobe-static
- **Scanned:** all of `src/` (17 files, ~1882 LOC), `package.json`, `.mcp.json`, `.gitignore`, asset layout under `public/`.
- **Skipped / N/A:** `node_modules`, `.next`, generated frames. **No backend, no API routes, no auth, no database, no `.env`, no `process.env` in `src`** — so the Security / Secrets / Auth / Authorization modules have essentially nothing to audit. This is a frontend-only demo with mock data.

## Summary
Healthy little codebase: no secrets, no `any`, no `console.*`, no `@ts-ignore`, no TODO/FIXME, clean TypeScript. **Zero CRITICAL or HIGH findings** — there is no server surface to attack. The real issues are **dead code** (an unused smooth-scroll component, an unused `frames.ts` module, and unused Zustand state) which in turn leaves **GSAP/Lenis/@gsap/react as orphaned runtime dependencies**, plus two quality items: building hotspots aren't keyboard-accessible, and all imagery uses raw `<img>` instead of `next/image`. Counts: **0 CRITICAL · 0 HIGH · 6 MEDIUM · 3 LOW**.

## Priority table
| # | Severity | Module | Location | Issue |
|---|----------|--------|----------|-------|
| 1 | MEDIUM | Dead code | `src/components/smooth-scroll.tsx` (whole file) | `SmoothScroll` defined but never imported/rendered |
| 2 | MEDIUM | Dependencies | `package.json:12-14` | `gsap`, `@gsap/react`, `lenis` only referenced by the dead SmoothScroll → orphaned deps |
| 3 | MEDIUM | Dead code | `src/lib/frames.ts` (whole file) | `HERO`/`frameUrl`/`posterUrl`/`MOODS` never imported anywhere |
| 4 | MEDIUM | Dead code | `src/lib/store.ts:18,23,45-51` | `dayNight`/`setDayNight`/`moodToTime`/`uiHidden`/`setUiHidden` have no readers |
| 5 | MEDIUM | Frontend / a11y | `src/components/apartments/apartments-overlay.tsx:310-327` | Unit hotspots (`<polygon onClick>`) not keyboard-focusable/operable |
| 6 | MEDIUM | Performance | gallery + all overlays (`<img>` usage) | Raw `<img>` instead of `next/image` → no optimization/responsive sizing |
| 7 | LOW | Duplication | `surroundings-overlay.tsx:26-30` & `amenities-overlay.tsx:14-19` | Glass-pill marker markup duplicated verbatim |
| 8 | LOW | Performance | `src/components/hero-sequence.tsx:56-79` | 299 frames eagerly decoded into memory on mount |
| 9 | LOW | React / state | `src/components/hero-sequence.tsx:117` | `setAptReady(true)` fires for any locked panel, not just Apartamentos |

## Findings (detailed)

### [#1] MEDIUM — `SmoothScroll` component is never used
- **Location:** `src/components/smooth-scroll.tsx` (entire file)
- **What:** Exports `SmoothScroll`, but no file imports it (`page.tsx`/`layout.tsx` don't render it). `grep` finds only its own definition.
- **Why it matters:** Dead code reads as if Lenis smooth-scroll is active. It also keeps GSAP/Lenis/ScrollTrigger "in use" on paper (see #2). The app is a single fixed viewport (`body { overflow:hidden }`), so there is no page scroll for Lenis to smooth — the component is inert by design.
- **Suggested fix:** Either delete the file, or actually mount it if smooth scrolling is planned. If keeping for a future scroll-driven section, add a comment that it's intentionally unmounted.
- **Confidence:** confirmed (no importers).

### [#2] MEDIUM — GSAP / @gsap/react / Lenis are orphaned dependencies
- **Location:** `package.json:12-14` (`@gsap/react`, `gsap`, `lenis`)
- **What:** The only references to `gsap`/`ScrollTrigger`/`lenis` are inside the unused `smooth-scroll.tsx`. `@gsap/react` (`useGSAP`) isn't referenced anywhere. The live scrub engine in `hero-sequence.tsx` is hand-rolled rAF + canvas and uses none of them.
- **Why it matters:** Unused runtime deps enlarge the install/supply-chain surface and mislead future devs about how animation works here. (They are tree-shaken from the client bundle as long as nothing imports them, so bundle impact is ~0 today — the cost is maintenance + supply chain, not shipped bytes.)
- **Suggested fix:** If #1 is deleted and no GSAP/Lenis work is imminent, drop the three deps:
  ```bash
  npm remove gsap @gsap/react lenis
  ```
  If the roadmap still wants GSAP/Lenis-driven scroll later, keep them but track that decision.
- **Confidence:** confirmed for current usage; the "remove" decision depends on roadmap intent.

### [#3] MEDIUM — `src/lib/frames.ts` is entirely unused
- **Location:** `src/lib/frames.ts` (entire file)
- **What:** `HERO`, `frameUrl`, `posterUrl`, `MOODS`, `Mood` are exported but nothing imports `@/lib/frames`. The hero uses its own constants in `hero-sequence.tsx` (`/frames/explore`, webp, COUNT=299), and `gallery.ts` defines its own local `frame()` for `/frames/hero/*.jpg`.
- **Why it matters:** Two parallel "frame URL" sources of truth; the dead one (`frames.ts`, jpg/120) can drift from reality and confuse asset swaps later.
- **Suggested fix:** Delete `frames.ts`, or make `gallery.ts` and the hero import from it so there's one descriptor. Given the hero and gallery use different asset sets (explore vs hero), deletion is the simpler honest move.
- **Confidence:** confirmed (no importers of `@/lib/frames`).

### [#4] MEDIUM — Unused Zustand state (`dayNight`, mood, `uiHidden`)
- **Location:** `src/lib/store.ts:18,23,33,37-38,45-51`
- **What:** `dayNight` / `setDayNight` have no readers or external callers; `moodToTime` is never called; `uiHidden` / `setUiHidden` are never read or set outside the store. The HUD replaced the time-of-day/mood bar with the compass, leaving this behind.
- **Why it matters:** Dead store fields imply features (day/night mood, UI-hide) that aren't wired, inflating the mental model of the state machine.
- **Suggested fix:** Remove the unused fields and `moodToTime`, or re-wire the mood slider if day/night is still planned (EXP-04 in REQUIREMENTS). Keep `panel`, `heading`, `aptReady` — those are live.
- **Confidence:** confirmed for current code (no readers). Lower to "intentional scaffold" if day/night mood is imminent.

### [#5] MEDIUM — Apartment unit hotspots aren't keyboard-accessible
- **Location:** `src/components/apartments/apartments-overlay.tsx:310-327`
- **What:** Units are clickable `<polygon>` elements with `onClick`/`onMouseEnter` and an `aria-label`, but SVG polygons aren't focusable and there's no `role`/`tabIndex`/key handler. Keyboard and screen-reader users can't select a unit.
- **Why it matters:** Brokers/clients on keyboard or AT can't use the core availability feature; also hurts the Lighthouse a11y exit gate (PERF-02 targets 90+).
- **Suggested fix:** Make hotspots focusable and operable, e.g. add `tabIndex={0}` + `role="button"` and an `onKeyDown` for Enter/Space:
  ```tsx
  <polygon
    tabIndex={on ? 0 : -1}
    role="button"
    onKeyDown={(e) => { if (on && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setSelected(u); } }}
    /* ...existing props... */
  />
  ```
  (Add a visible focus outline via CSS for the focused polygon.)
- **Confidence:** confirmed.

### [#6] MEDIUM — Raw `<img>` everywhere instead of `next/image`
- **Location:** `gallery-overlay.tsx:120,172`; `surroundings-overlay.tsx` (bg + photos); `amenities-overlay.tsx:14` bg; `apartments-overlay.tsx` floorplans — each `// eslint-disable-next-line @next/next/no-img-element`.
- **What:** All imagery bypasses Next image optimization (AVIF/WebP negotiation, responsive `srcset`, intrinsic sizing).
- **Why it matters:** Larger transfers and weaker LCP — directly relevant to PERF-01 (LCP < 2.5s) and PERF-02 (Lighthouse 90+). The gallery grid (many lazy thumbnails) and the full-screen overlay backgrounds are the biggest wins.
- **Suggested fix:** Use `next/image` for the *static, known-size* surfaces (gallery thumbnails, overlay backgrounds with `fill`, floorplans). Keep raw `<img>`/canvas only for the frame-scrub hero where Next Image doesn't fit. Example for a gallery thumb:
  ```tsx
  import Image from "next/image";
  <Image src={s.src} alt={s.title} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" />
  ```
- **Confidence:** confirmed pattern; the per-surface decision (which to migrate) needs judgment, since the hero intentionally stays raw.

### [#7] LOW — Marker pill markup duplicated across overlays
- **Location:** `src/components/surroundings/surroundings-overlay.tsx:26-30` and `src/components/amenities/amenities-overlay.tsx:14-19`
- **What:** The non-active "glass pill + icon + label" marker uses the same long Tailwind class string in both files.
- **Why it matters:** Style drift risk — a tweak in one screen won't match the other (already diverging: amenities anchors by icon center, surroundings centers the pill).
- **Suggested fix:** Extract a shared `<MarkerPill icon label />` (or a `markerPill` class constant) used by both overlays.
- **Confidence:** confirmed.

### [#8] LOW — Hero eagerly decodes all 299 frames into memory on mount
- **Location:** `src/components/hero-sequence.tsx:56-79`
- **What:** On mount (non-reduced-motion) it creates 299 `Image` objects and decodes them up front with no concurrency cap or idle scheduling.
- **Why it matters:** This is the documented image-sequence approach (correct for symmetric scrub), but 299 decoded bitmaps is real memory, and the burst competes with first paint on mid/low-end devices (EXP-02 targets 30fps mobile). It's a deliberate tradeoff, not a defect.
- **Suggested fix:** Keep the approach, but consider a small concurrency window, decoding visible-first frames before the rest, and/or a reduced frame count / lower-res tier on mobile. Gate behind a "loaded enough to start" threshold rather than all-299.
- **Confidence:** confirmed behavior; "problem" only under low-end memory pressure.

### [#9] LOW — `aptReady` is set for any locked panel, not just Apartamentos
- **Location:** `src/components/hero-sequence.tsx:117` (inside `tick`)
- **What:** Since `locked.current = panel !== "none"`, when the scrub settles while *any* panel is open, `setAptReady(true)` fires. `aptReady` is only consumed by the Apartamentos overlay, so it's harmless today.
- **Why it matters:** Coupling that will bite if `aptReady` is ever read by another surface; the flag's name no longer matches when it's set.
- **Suggested fix:** Guard the settle callback with `if (locked.current && useExperience.getState().panel === "apartments")`, or rename the flag to reflect "hero settled".
- **Confidence:** confirmed (no current bug; latent).

## What was checked but looked OK
- **Secrets/config:** no hardcoded keys, no `.env`, no `process.env` in `src`; `.mcp.json` contains only a public Figma MCP URL. `.gitignore` covers `.env*`, `.next`, `.dev.log`.
- **TypeScript:** no `any`, no `as any`, no `@ts-ignore/expect-error`; data modules are well-typed with `as const` + derived unions.
- **React hooks:** effects in `gallery-overlay`, `hero-sequence`, `surroundings/amenities` have correct cleanup (listeners removed, rAF cancelled, Lenis/ticker torn down). Dependency arrays are reasonable; the one large hero effect documents its `exhaustive-deps` disable.
- **Error handling:** image `onerror` is handled in the hero preloader; no swallowed promises in critical paths (there are none — fully client/mock).
- **Gallery assets:** `public/frames/hero/{day,night}` + manifest exist, so gallery `src` paths resolve (not broken).
- **Bugs/observability:** no `console` noise, no obvious off-by-one in the dual-range clamp or lightbox modulo navigation.

## Suggested next steps
1. **Decide the GSAP/Lenis question (#1 + #2 + #3 + #4 together).** If day/night mood and scroll-driven sections are *not* imminent: delete `smooth-scroll.tsx` + `frames.ts`, prune the dead store fields, and `npm remove gsap @gsap/react lenis`. If they *are* imminent: leave them but add a one-line "intentionally staged" note so this audit's finding is explained.
2. **Fix hotspot keyboard access (#5)** — small change, real accessibility + Lighthouse payoff.
3. **Migrate the static imagery to `next/image` (#6)** — gallery thumbnails and overlay backgrounds first; measure LCP before/after.
4. **Tidy-ups (#7–#9)** when convenient: extract the shared marker pill, scope `aptReady`, revisit hero preloading for mobile.

---
**Reminder:** this was a read-only audit — **nothing in the project was changed.** Tell me which findings you want addressed (e.g. "apply #1–#4" or "fix #5") and I'll make those edits.

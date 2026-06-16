"use client";

import { useEffect, useState } from "react";

// Proportional HUD scaling: the building render is object-cover (fills the
// viewport, so it grows with the screen), but the chrome (dock, filters, side
// panels) is laid out in fixed px. On large monitors that chrome looks tiny.
// This returns a `zoom` factor tied to the viewport width (1920 = design width)
// so the chrome keeps the same proportion to the scene on every screen.
const DESIGN_W = 1920;
const MIN = 0.85;
const MAX = 1.7;

export function useUiScale(): number {
  // Start at 1 (matches SSR) to avoid a hydration mismatch; refine after mount.
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.max(MIN, Math.min(window.innerWidth / DESIGN_W, MAX)));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return scale;
}

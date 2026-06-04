"use client";

import { useEffect } from "react";
import { useExperience, type Panel } from "@/lib/store";

const PANELS: Panel[] = ["none", "apartments", "gallery", "amenities", "surroundings"];

/**
 * Keeps the active module in the URL (`?view=<panel>`) so a page refresh
 * stays on the same screen instead of snapping back to Explorar, and the
 * link is shareable. Renders nothing.
 */
export default function PanelUrlSync() {
  const panel = useExperience((s) => s.panel);
  const openPanel = useExperience((s) => s.openPanel);

  // Restore from the URL once on mount.
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("view");
    if (v && v !== "none" && PANELS.includes(v as Panel)) {
      openPanel(v as Panel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect panel changes back into the URL (no history spam).
  useEffect(() => {
    const url = new URL(window.location.href);
    if (panel === "none") url.searchParams.delete("view");
    else url.searchParams.set("view", panel);
    window.history.replaceState(null, "", url.toString());
  }, [panel]);

  return null;
}

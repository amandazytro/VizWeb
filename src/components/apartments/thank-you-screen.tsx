"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useT } from "@/lib/i18n";

// Brochura 3 — "thank you" screen. Stays 5s, then returns to the home (Explore)
// screen via onDone. Clicking the link returns immediately.
export default function ThankYouScreen({ onDone }: { onDone: () => void }) {
  const t = useT();

  useEffect(() => {
    const id = setTimeout(onDone, 5000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="zy-fadein pointer-events-auto fixed inset-0 z-[80] overflow-hidden text-white">
      {/* blurred tower backdrop */}
      <Image src="/frames/explore/0156.webp" alt="" fill priority sizes="100vw" className="scale-110 object-cover blur-2xl" />
      <div className="absolute inset-0 bg-[#0a121c]/70" />

      {/* centred message */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <h1
          style={{ fontFamily: "var(--font-canela), Georgia, serif" }}
          className="max-w-[440px] text-[34px] font-bold leading-[1.06] opacity-95"
        >
          {t("ty.title")}
        </h1>
        <p
          style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
          className="mt-4 max-w-[380px] text-[16px] font-light opacity-90"
        >
          {t("ty.subtitle")}
        </p>
        <p
          style={{ fontFamily: "var(--font-canela), Georgia, serif" }}
          className="mt-2.5 text-[13px] italic opacity-80"
        >
          {t("ty.hint")}{" "}
          <button type="button" onClick={onDone} className="underline underline-offset-2 transition hover:opacity-100">
            {t("ty.hintLink")}
          </button>
        </p>

        {/* schedule-a-visit CTA (outlined beige, per Figma) */}
        <button
          type="button"
          onClick={onDone}
          style={{ fontFamily: "var(--font-canela), Georgia, serif" }}
          className="mt-6 rounded-2xl border border-[#f1d7b0] px-6 py-2.5 text-[13px] font-bold text-[#f1d7b0] transition hover:bg-[#f1d7b0] hover:text-[#0a121c]"
        >
          {t("ty.schedule")}
        </button>
      </div>
    </div>
  );
}

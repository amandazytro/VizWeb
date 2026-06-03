// Shared glass-pill marker used by the Aproximidades and Áreas Comuns
// overlays: a frosted pill with a purple-square icon and a label.
// Icons are small SVGs, so a raw <img> is intentional (next/image adds no
// value for inline SVG and would need unoptimized).

export default function MarkerPill({ src, label }: { src: string; label: string }) {
  return (
    <span className="flex items-center gap-3 rounded-3xl border border-white/25 bg-white/15 py-1.5 pl-1.5 pr-5 shadow-[0_6px_20px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition hover:bg-white/25">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-11 w-11" />
      <span className="whitespace-nowrap text-base font-medium text-white">{label}</span>
    </span>
  );
}

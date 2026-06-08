// Shared glass-pill marker used by the Aproximidades and Áreas Comuns
// overlays: a frosted pill with a purple-square icon and a label.
// Icons are small SVGs, so a raw <img> is intentional (next/image adds no
// value for inline SVG and would need unoptimized).

export default function MarkerPill({ src, label }: { src: string; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-[17px] border border-white/25 bg-white/15 py-1 pl-1 pr-4 shadow-[0_6px_20px_rgba(0,0,0,0.25)] backdrop-blur-md backdrop-saturate-150 transition duration-200 hover:scale-105 hover:border-[#8667ea]/40 hover:bg-white/25 hover:shadow-[0_6px_20px_rgba(0,0,0,0.25),0_0_16px_2px_rgba(134,103,234,0.45)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-9 w-9" />
      <span className="whitespace-nowrap text-[13px] font-medium text-white">{label}</span>
    </span>
  );
}
